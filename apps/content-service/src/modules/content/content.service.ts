import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { Prisma } from '@prisma/client';
import { VersioningService, ContentSnapshot } from '../versioning/versioning.service';
import { TaggingService } from '../tagging/tagging.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';

/**
 * ContentService - Handles all content CRUD operations with versioning
 *
 * Versioning Flow:
 * - CREATE: Save version 1 with initial snapshot
 * - UPDATE: Save version N+1 with updated snapshot
 * - ARCHIVE: Save version before archiving
 * - RESTORE: Copy snapshot to content + create new version
 */
@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private prisma: PrismaService,
    private versioning: VersioningService,
    private tagging: TaggingService,
  ) {}

  /**
   * CREATE Content → Creates version 1 with initial snapshot
   */
  async create(dto: CreateContentDto, authorId: string) {
    // Verify author exists
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });
    if (!author) {
      throw new BadRequestException(`User with ID ${authorId} not found`);
    }

    try {
      // Create content with metadata if provided
      const content = await this.prisma.content.create({
        data: {
          title: dto.title,
          body: dto.body ?? null,
          contentType: dto.contentType,
          resourceUrl: dto.resourceUrl ?? null,
          authorId,
          ...(dto.metadata && {
            metadata: {
              create: dto.metadata,
            },
          }),
        },
        include: {
          metadata: true,
          tags: { include: { tag: true } },
        },
      });

      // Attach tags if provided
      if (dto.tags && dto.tags.length > 0) {
        await this.tagging.attachToContent(content.id, dto.tags);
      }

      // Build snapshot for version 1
      const snapshot = await this.versioning.buildSnapshotFromContent(content.id);

      // Create version 1
      await this.versioning.createSnapshot(
        content.id,
        snapshot,
        1,
        'Initial creation',
        authorId,
      );

      // Return content with all relations
      return this.findOne(content.id);
    } catch (err) {
      this.logger.error('Create error:', err);
      throw new BadRequestException('Cannot create content');
    }
  }

  /**
   * Find all content with optional filters
   */
  async findAll(query: QueryContentDto) {
    try {
      const where: Prisma.ContentWhereInput = {};

      if (query.type) where.contentType = query.type;
      if (!query.includeArchived) where.isArchived = false;
      if (query.search) {
        where.title = { contains: query.search, mode: 'insensitive' };
      }
      if (query.tag) {
        where.tags = {
          some: {
            tag: { name: query.tag },
          },
        };
      }

      const contents = await this.prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          metadata: true,
          tags: { include: { tag: true } },
          author: {
            select: { id: true, email: true, fullName: true },
          },
        },
        skip: query.offset || 0,
        take: query.limit || 20,
      });

      // Format tags as string array
      return contents.map((c) => ({
        ...c,
        tags: c.tags.map((t) => t.tag.name),
      }));
    } catch (err) {
      this.logger.error('FindAll error:', err);
      throw new BadRequestException('Cannot load content list');
    }
  }

  /**
   * Find one content by ID with all relations
   */
  async findOne(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        metadata: true,
        tags: { include: { tag: true } },
        author: {
          select: { id: true, email: true, fullName: true },
        },
        files: {
          where: { deletedAt: null },
          select: {
            fileId: true,
            fileName: true,
            fileSize: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    return {
      ...content,
      tags: content.tags.map((t) => t.tag.name),
    };
  }

  /**
   * UPDATE Content → Creates version N+1 with updated snapshot
   */
  async update(id: string, dto: UpdateContentDto, updatedBy: string) {
    const existingContent = await this.findOne(id);

    // Get next version number before update
    const nextVersion = await this.versioning.getNextVersion(id);

    // Build change note
    let changeNote = 'Content updated';
    if (dto.title && dto.title !== existingContent.title) {
      changeNote = `Title changed: "${existingContent.title}" → "${dto.title}"`;
    }

    // Update content
    await this.prisma.content.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.contentType && { contentType: dto.contentType }),
        ...(dto.resourceUrl !== undefined && { resourceUrl: dto.resourceUrl }),
        ...(dto.metadata && {
          metadata: {
            upsert: {
              create: dto.metadata,
              update: dto.metadata,
            },
          },
        }),
      },
    });

    // Update tags if provided
    if (dto.tags !== undefined) {
      await this.tagging.clearTagsFromContent(id);
      if (dto.tags.length > 0) {
        await this.tagging.attachToContent(id, dto.tags);
      }
    }

    // Build snapshot of updated content
    const snapshot = await this.versioning.buildSnapshotFromContent(id);

    // Create new version with snapshot
    await this.versioning.createSnapshot(
      id,
      snapshot,
      nextVersion,
      changeNote,
      updatedBy,
    );

    return this.findOne(id);
  }

  /**
   * ARCHIVE Content → Saves version before archiving
   */
  async archive(id: string, archivedBy: string) {
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
  async restore(id: string, restoredBy: string) {
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
   * List all versions for a content
   */
  async listVersions(id: string) {
    await this.findOne(id); // Verify content exists
    return this.versioning.getVersions(id);
  }

  /**
   * RESTORE from specific version → Copies snapshot to content + creates new version
   */
  async restoreVersion(id: string, versionId: string, restoredBy: string) {
    await this.findOne(id); // Verify content exists
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
   * Get archived content list
   */
  async getArchived(query: QueryContentDto) {
    return this.findAll({ ...query, includeArchived: true });
  }

  /**
   * Delete content permanently (hard delete)
   * Use with caution - this cannot be undone
   */
  async delete(id: string) {
    const content = await this.findOne(id);

    // Delete all related data
    await this.prisma.$transaction([
      this.prisma.contentVersion.deleteMany({ where: { contentId: id } }),
      this.prisma.tagsOnContents.deleteMany({ where: { contentId: id } }),
      this.prisma.metadata.deleteMany({ where: { contentId: id } }),
      this.prisma.file.deleteMany({ where: { contentId: id } }),
      this.prisma.content.delete({ where: { id } }),
    ]);

    return { deleted: true, id };
  }
}

