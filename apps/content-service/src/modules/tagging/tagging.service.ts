import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@app/database';

/**
 * TaggingService - Handles content tagging operations
 */
@Injectable()
export class TaggingService {
  private readonly logger = new Logger(TaggingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all tags
   */
  async getAllTags() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { contents: true },
        },
      },
    });
  }

  /**
   * Get a tag by ID with its contents
   */
  async getTagById(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        contents: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                contentType: true,
                isArchived: true,
              },
            },
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return tag;
  }

  /**
   * Get a tag by name
   */
  async getTagByName(name: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { name },
      include: {
        contents: {
          include: {
            content: {
              select: {
                id: true,
                title: true,
                contentType: true,
                isArchived: true,
              },
            },
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag "${name}" not found`);
    }

    return tag;
  }

  /**
   * Search tags by name prefix
   */
  async searchTags(query: string) {
    return this.prisma.tag.findMany({
      where: {
        name: {
          startsWith: query,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
      take: 10,
    });
  }

  /**
   * Attach tags to a content
   * Creates tags if they don't exist
   */
  async attachToContent(contentId: string, tagNames: string[]) {
    // Verify content exists
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content ${contentId} not found`);
    }

    const attached: string[] = [];
    const skipped: string[] = [];

    for (const name of tagNames) {
      const trimmedName = name.trim().toLowerCase();
      if (!trimmedName) continue;

      // Get or create tag
      const tag = await this.prisma.tag.upsert({
        where: { name: trimmedName },
        update: {},
        create: { name: trimmedName },
      });

      try {
        // Try to create the relation
        await this.prisma.tagsOnContents.create({
          data: {
            contentId,
            tagId: tag.id,
          },
        });
        attached.push(trimmedName);
      } catch (err) {
        // Relation already exists
        skipped.push(trimmedName);
      }
    }

    return { attached, skipped };
  }

  /**
   * Detach a tag from content
   */
  async detachFromContent(contentId: string, tagName: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { name: tagName.trim().toLowerCase() },
    });

    if (!tag) {
      return { removed: false, message: 'Tag not found' };
    }

    const result = await this.prisma.tagsOnContents.deleteMany({
      where: {
        contentId,
        tagId: tag.id,
      },
    });

    return {
      removed: result.count > 0,
      message: result.count > 0 ? 'Tag removed' : 'Tag was not attached',
    };
  }

  /**
   * Clear all tags from a content
   */
  async clearTagsFromContent(contentId: string) {
    const result = await this.prisma.tagsOnContents.deleteMany({
      where: { contentId },
    });

    return { removed: result.count };
  }

  /**
   * Get all tags for a content
   */
  async getTagsForContent(contentId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content ${contentId} not found`);
    }

    return content.tags.map((t) => t.tag);
  }

  /**
   * Get content IDs by tag name
   */
  async getContentIdsByTag(tagName: string): Promise<string[]> {
    const tag = await this.prisma.tag.findUnique({
      where: { name: tagName.trim().toLowerCase() },
      include: {
        contents: {
          select: { contentId: true },
        },
      },
    });

    if (!tag) return [];

    return tag.contents.map((c) => c.contentId);
  }
}

