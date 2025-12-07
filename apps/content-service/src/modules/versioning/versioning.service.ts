import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { Prisma } from '@prisma/client';

/**
 * Interface for content snapshot data
 * Contains all restorable fields from Content model
 */
export interface ContentSnapshot {
  title: string;
  body: string | null;
  contentType: string;
  resourceUrl: string | null;
  hierarchyId: string | null;
  metadata: {
    subject?: string | null;
    topic?: string | null;
    difficulty?: string | null;
    duration?: number | null;
    prerequisites?: string | null;
  } | null;
  tags: string[];
}

/**
 * VersioningService - Handles content versioning with full snapshot support
 *
 * Versioning Flow:
 * - CREATE: Save version 1 with initial snapshot
 * - UPDATE: Save version N+1 with updated snapshot
 * - ARCHIVE: Save version before archiving
 * - RESTORE: Copy snapshot to content + create new version
 */
@Injectable()
export class VersioningService {
  private readonly logger = new Logger(VersioningService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a snapshot of content at current state
   * Called after CREATE or UPDATE operations
   */
  async createSnapshot(
    contentId: string,
    snapshot: ContentSnapshot,
    version: number,
    changeNote?: string,
    createdBy?: string,
  ) {
    try {
      return await this.prisma.contentVersion.create({
        data: {
          contentId,
          version,
          snapshot: snapshot as unknown as Prisma.JsonObject,
          changeNote: changeNote || null,
          createdBy: createdBy || null,
        },
      });
    } catch (err) {
      this.logger.error('Create snapshot error:', err);
      throw new BadRequestException('Cannot create version snapshot');
    }
  }

  /**
   * Get the next version number for a content
   */
  async getNextVersion(contentId: string): Promise<number> {
    const lastVersion = await this.prisma.contentVersion.findFirst({
      where: { contentId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return (lastVersion?.version ?? 0) + 1;
  }

  /**
   * Get all versions for a content
   */
  async getVersions(contentId: string) {
    return this.prisma.contentVersion.findMany({
      where: { contentId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        changeNote: true,
        createdBy: true,
        createdAt: true,
        snapshot: true,
      },
    });
  }

  /**
   * Get a specific version by version number
   */
  async getVersion(contentId: string, version: number) {
    const ver = await this.prisma.contentVersion.findUnique({
      where: {
        contentId_version: { contentId, version },
      },
    });

    if (!ver) {
      throw new NotFoundException(
        `Version ${version} not found for content ${contentId}`,
      );
    }

    return ver;
  }

  /**
   * Get a specific version by ID
   */
  async getVersionById(versionId: string) {
    const ver = await this.prisma.contentVersion.findUnique({
      where: { id: versionId },
    });

    if (!ver) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    return ver;
  }

  /**
   * Create snapshot from a Content object with all its relations
   */
  async buildSnapshotFromContent(contentId: string): Promise<ContentSnapshot> {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: {
        metadata: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content ${contentId} not found`);
    }

    return {
      title: content.title,
      body: content.body,
      contentType: content.contentType,
      resourceUrl: content.resourceUrl,
      hierarchyId: content.hierarchyId,
      metadata: content.metadata
        ? {
            subject: content.metadata.subject,
            topic: content.metadata.topic,
            difficulty: content.metadata.difficulty,
            duration: content.metadata.duration,
            prerequisites: content.metadata.prerequisites,
          }
        : null,
      tags: content.tags.map((t) => t.tag.name),
    };
  }

  /**
   * Restore content from a version snapshot
   * Also creates a new version recording the restore action
   */
  async restoreFromVersion(
    contentId: string,
    versionId: string,
    restoredBy?: string,
  ) {
    // Get the version to restore from
    const version = await this.getVersionById(versionId);

    if (version.contentId !== contentId) {
      throw new BadRequestException(
        'Version does not belong to this content',
      );
    }

    const snapshot = version.snapshot as unknown as ContentSnapshot;

    // Get next version number
    const nextVersion = await this.getNextVersion(contentId);

    // Use transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      // Update content with snapshot data
      const updatedContent = await tx.content.update({
        where: { id: contentId },
        data: {
          title: snapshot.title,
          body: snapshot.body,
          contentType: snapshot.contentType,
          resourceUrl: snapshot.resourceUrl,
          hierarchyId: snapshot.hierarchyId,
          isArchived: false, // Unarchive if archived
          archivedAt: null,
        },
      });

      // Update metadata if exists in snapshot
      if (snapshot.metadata) {
        await tx.metadata.upsert({
          where: { contentId },
          create: {
            contentId,
            subject: snapshot.metadata.subject || null,
            topic: snapshot.metadata.topic || null,
            difficulty: snapshot.metadata.difficulty || null,
            duration: snapshot.metadata.duration || null,
            prerequisites: snapshot.metadata.prerequisites || null,
          },
          update: {
            subject: snapshot.metadata.subject || null,
            topic: snapshot.metadata.topic || null,
            difficulty: snapshot.metadata.difficulty || null,
            duration: snapshot.metadata.duration || null,
            prerequisites: snapshot.metadata.prerequisites || null,
          },
        });
      }

      // Restore tags if exists in snapshot
      if (snapshot.tags && snapshot.tags.length > 0) {
        // Remove existing tags
        await tx.tagsOnContents.deleteMany({
          where: { contentId },
        });

        // Add tags from snapshot
        for (const tagName of snapshot.tags) {
          // Get or create tag
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            create: { name: tagName },
            update: {},
          });

          // Link tag to content
          await tx.tagsOnContents.create({
            data: { contentId, tagId: tag.id },
          });
        }
      }

      // Create new version recording the restore action
      await tx.contentVersion.create({
        data: {
          contentId,
          version: nextVersion,
          snapshot: snapshot as unknown as Prisma.JsonObject,
          changeNote: `Restored from version ${version.version}`,
          createdBy: restoredBy || null,
        },
      });

      return updatedContent;
    });
  }

  /**
   * Compare two versions and return differences
   */
  async compareVersions(
    contentId: string,
    versionA: number,
    versionB: number,
  ) {
    const [verA, verB] = await Promise.all([
      this.getVersion(contentId, versionA),
      this.getVersion(contentId, versionB),
    ]);

    const snapshotA = verA.snapshot as unknown as ContentSnapshot;
    const snapshotB = verB.snapshot as unknown as ContentSnapshot;

    const changes: Record<string, { from: unknown; to: unknown }> = {};

    // Compare each field
    const fields: (keyof ContentSnapshot)[] = [
      'title',
      'body',
      'contentType',
      'resourceUrl',
      'hierarchyId',
    ];

    for (const field of fields) {
      if (snapshotA[field] !== snapshotB[field]) {
        changes[field] = {
          from: snapshotA[field],
          to: snapshotB[field],
        };
      }
    }

    // Compare metadata
    if (JSON.stringify(snapshotA.metadata) !== JSON.stringify(snapshotB.metadata)) {
      changes['metadata'] = {
        from: snapshotA.metadata,
        to: snapshotB.metadata,
      };
    }

    // Compare tags
    const tagsA = snapshotA.tags?.sort().join(',') || '';
    const tagsB = snapshotB.tags?.sort().join(',') || '';
    if (tagsA !== tagsB) {
      changes['tags'] = {
        from: snapshotA.tags,
        to: snapshotB.tags,
      };
    }

    return {
      versionA: { version: versionA, createdAt: verA.createdAt },
      versionB: { version: versionB, createdAt: verB.createdAt },
      changes,
      hasChanges: Object.keys(changes).length > 0,
    };
  }
}

