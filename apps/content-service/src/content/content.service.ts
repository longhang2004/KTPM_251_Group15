import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { VersioningService, ContentSnapshot } from './versioning.service';
import { TaggingService } from './tagging.service';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private versioning: VersioningService,
    private tagging: TaggingService,
  ) {}

  /**
   * CREATE Content → Creates version 1 with initial snapshot
   */
  async create(dto: CreateContentDto, authorId: string) {
    try {
      // Create content
      const content = await this.prisma.content.create({
        data: {
          title: dto.title,
          body: dto.body ?? null,
          contentType: dto.contentType,
          resourceUrl: dto.resourceUrl ?? null,
          author: {
            connect: { id: authorId },
          },
        },
      });

      // Build snapshot for version 1
      const snapshot: ContentSnapshot = {
        title: content.title,
        body: content.body,
        contentType: content.contentType,
        resourceUrl: content.resourceUrl,
        hierarchyId: content.hierarchyId,
        metadata: null,
        tags: [],
      };

      // Create version 1
      await this.versioning.createSnapshot(
        content.id,
        snapshot,
        1, // First version
        'Initial creation',
        authorId,
      );

      return content;
    } catch (err) {
      console.error('Create error:', err);
      throw new BadRequestException('Cannot create content');
    }
  }

  /**
   * Find all content with optional filters
   */
  async findAll(query: {
    type?: string;
    includeArchived?: boolean;
    search?: string;
  }) {
    try {
      const where: Record<string, unknown> = {};

      if (query.type) where.contentType = query.type;
      if (!query.includeArchived) where.isArchived = false;
      if (query.search)
        where.title = { contains: query.search, mode: 'insensitive' };

      return await this.prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('FindAll error:', err);
      throw new BadRequestException('Cannot load content list');
    }
  }

  /**
   * Find one content by ID
   */
  async findOne(id: string) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) throw new NotFoundException('Content not found');
    return content;
  }

  /**
   * UPDATE Content → Creates version N+1 with updated snapshot
   */
  async update(id: string, dto: UpdateContentDto, updatedBy?: string) {
    const existingContent = await this.findOne(id);

    // Update content
    const updatedContent = await this.prisma.content.update({
      where: { id },
      data: { ...dto },
    });

    // Get next version number
    const nextVersion = await this.versioning.getNextVersion(id);

    // Build snapshot of updated content
    const snapshot = await this.versioning.buildSnapshotFromContent(id);

    // Create new version with snapshot
    await this.versioning.createSnapshot(
      id,
      snapshot,
      nextVersion,
      dto.title !== existingContent.title
        ? `Title changed: "${existingContent.title}" → "${dto.title}"`
        : 'Content updated',
      updatedBy,
    );

    return updatedContent;
  }

  /**
   * ARCHIVE Content → Saves version before archiving
   */
  async archive(id: string, archivedBy?: string) {
    const content = await this.findOne(id);

    if (content.isArchived) {
      throw new BadRequestException('Content is already archived');
    }

    // Get next version number
    const nextVersion = await this.versioning.getNextVersion(id);

    // Build snapshot before archiving
    const snapshot = await this.versioning.buildSnapshotFromContent(id);

    // Create version snapshot before archive
    await this.versioning.createSnapshot(
      id,
      snapshot,
      nextVersion,
      'Archived',
      archivedBy,
    );

    // Archive content
    return this.prisma.content.update({
      where: { id },
      data: { isArchived: true, archivedAt: new Date() },
    });
  }

  /**
   * RESTORE Content from archive (unarchive)
   */
  async restore(id: string, restoredBy?: string) {
    const content = await this.findOne(id);

    if (!content.isArchived) {
      throw new BadRequestException('Content is not archived');
    }

    // Get next version number
    const nextVersion = await this.versioning.getNextVersion(id);

    // Build snapshot
    const snapshot = await this.versioning.buildSnapshotFromContent(id);

    // Create version snapshot for restore action
    await this.versioning.createSnapshot(
      id,
      snapshot,
      nextVersion,
      'Restored from archive',
      restoredBy,
    );

    // Unarchive content
    return this.prisma.content.update({
      where: { id },
      data: { isArchived: false, archivedAt: null },
    });
  }

  /**
   * List all content, optionally filtered by tag
   */
  async list(tag?: string) {
    if (!tag) {
      const contents = await this.prisma.content.findMany({
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
      return contents.map((d) => ({
        ...d,
        tags: d.tags.map((dt) => dt.tag.name),
      }));
    }

    const tagObj = await this.prisma.tag.findUnique({ where: { name: tag } });

    if (!tagObj) return [];

    const conTags = await this.prisma.tagsOnContents.findMany({
      where: { tagId: tagObj.id },
      include: { content: true },
    });

    return conTags.map((dt) => dt.content);
  }

  /**
   * Get content with tags and versions
   */
  async getTag(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          select: {
            id: true,
            version: true,
            changeNote: true,
            createdBy: true,
            createdAt: true,
          },
        },
        tags: {
          include: { tag: true },
        },
      },
    });
    if (!content) throw new NotFoundException('Content not found');
    return { ...content, tags: content.tags.map((dt) => dt.tag.name) };
  }

  /**
   * List all versions for a content
   */
  async listVersions(id: string) {
    await this.findOne(id); // Verify content exists
    return this.versioning.getVersions(id);
  }

  /**
   * RESTORE from specific version → Copies snapshot to content + creates new version
   */
  async restoreVersion(id: string, versionId: string, restoredBy?: string) {
    await this.findOne(id); // Verify content exists

    // Use versioning service to restore from version
    return this.versioning.restoreFromVersion(id, versionId, restoredBy);
  }

  /**
   * Compare two versions
   */
  async compareVersions(id: string, versionA: number, versionB: number) {
    await this.findOne(id); // Verify content exists
    return this.versioning.compareVersions(id, versionA, versionB);
  }

  /**
   * Attach tags to content
   */
  async attachTags(id: string, tags: string[], updatedBy?: string) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) throw new NotFoundException('Document not found');

    const result = await this.tagging.attachToContent(id, tags);

    // Create version snapshot after tags change
    const nextVersion = await this.versioning.getNextVersion(id);
    const snapshot = await this.versioning.buildSnapshotFromContent(id);
    await this.versioning.createSnapshot(
      id,
      snapshot,
      nextVersion,
      `Tags added: ${tags.join(', ')}`,
      updatedBy,
    );

    return result;
  }

  /**
   * Detach tag from content
   */
  async detachTag(id: string, tagName: string, updatedBy?: string) {
    const result = await this.tagging.detachFromContent(id, tagName);

    // Create version snapshot after tags change
    const nextVersion = await this.versioning.getNextVersion(id);
    const snapshot = await this.versioning.buildSnapshotFromContent(id);
    await this.versioning.createSnapshot(
      id,
      snapshot,
      nextVersion,
      `Tag removed: ${tagName}`,
      updatedBy,
    );

    return result;
  }
}
