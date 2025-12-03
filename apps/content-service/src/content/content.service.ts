import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { Prisma } from '@prisma/client';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContentDto, authorId: string) {
    try {
      // Build data object with nested relations
      const data: any = {
        title: dto.title,
        body: dto.body ?? null,
        contentType: dto.contentType,
        resourceUrl: dto.resourceUrl ?? null,
        author: {
          connect: { id: authorId },
        },
      };

      // Add metadata if provided
      if (dto.metadata) {
        data.metadata = {
          create: {
            subject: dto.metadata.subject ?? null,
            topic: dto.metadata.topic ?? null,
            difficulty: dto.metadata.difficulty ?? null,
            duration: dto.metadata.duration ?? null,
            prerequisites: dto.metadata.prerequisites ?? null,
          },
        };
      }

      // Add hierarchy if provided
      if (dto.hierarchyId) {
        data.hierarchy = {
          connect: { id: dto.hierarchyId },
        };
      }

      // Add tags if provided (connect or create)
      if (dto.tags && dto.tags.length > 0) {
        data.tags = {
          create: dto.tags.map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName },
              },
            },
          })),
        };
      }

      return await this.prisma.content.create({
        data,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          metadata: true,
          hierarchy: true,
        },
      });
    } catch (err) {
      console.error('Create error:', err);
      throw new BadRequestException('Cannot create content');
    }
  }

  /**
   * Advanced search and filter (FR-LCM-06)
   * Supports: search, type, status, author, tags, hierarchy, metadata, pagination, sorting
   */
  async findAll(query: QueryContentDto) {
    try {
      const where: Prisma.ContentWhereInput = {};

      // Search in title and body
      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { body: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      // Filter by content type
      if (query.type) {
        where.contentType = query.type;
      }

      // Filter by author
      if (query.authorId) {
        where.authorId = query.authorId;
      }

      // Filter by tags
      if (query.tags && query.tags.length > 0) {
        where.tags = {
          some: {
            tag: {
              name: {
                in: query.tags,
                mode: 'insensitive',
              },
            },
          },
        };
      }

      // Filter by hierarchy
      if (query.hierarchyId) {
        where.hierarchyId = query.hierarchyId;
      }

      // Filter by metadata
      if (query.subject || query.topic || query.difficulty) {
        where.metadata = {};
        if (query.subject) {
          where.metadata.subject = {
            contains: query.subject,
            mode: 'insensitive',
          };
        }
        if (query.topic) {
          where.metadata.topic = { contains: query.topic, mode: 'insensitive' };
        }
        if (query.difficulty) {
          where.metadata.difficulty = query.difficulty;
        }
      }

      // Archive filter
      if (query.includeArchived !== 'true') {
        where.isArchived = false;
      }

      // Pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Sorting
      const sortBy = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder || 'desc';
      const orderBy: Prisma.ContentOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      // Execute query with pagination
      const [contents, total] = await Promise.all([
        this.prisma.content.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            author: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
            metadata: true,
            hierarchy: true,
            _count: {
              select: {
                versions: true,
              },
            },
          },
        }),
        this.prisma.content.count({ where }),
      ]);

      return {
        data: contents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      console.error('FindAll error:', err);
      throw new BadRequestException('Cannot load content list');
    }
  }

  async findOne(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        metadata: true,
        hierarchy: true,
        versions: {
          orderBy: {
            version: 'desc',
          },
        },
      },
    });
    if (!content) throw new NotFoundException('Content not found');
    return content;
  }

  /**
   * Update content with ownership check (FR-LCM-07)
   * Only author, ADMIN, or INSTRUCTOR with UPDATE permission can update
   */
  async update(
    id: string,
    dto: UpdateContentDto,
    userId?: string,
    userRoles?: string[],
  ) {
    const content = await this.findOne(id);

    // Security check: Only author, ADMIN, or INSTRUCTOR can update
    if (userId) {
      const isAuthor = content.authorId === userId;
      const isAdmin = userRoles?.includes('ADMIN');
      const isInstructor = userRoles?.includes('INSTRUCTOR');

      if (!isAuthor && !isAdmin && !isInstructor) {
        throw new ForbiddenException(
          'You can only update your own content or have ADMIN/INSTRUCTOR role',
        );
      }
    }

    // Separate metadata and tags from other fields
    const { metadata, tags, hierarchyId, ...contentData } = dto;

    // Build update data - only include fields that exist in Content model
    const updateData: any = {};

    // Update basic content fields (only if provided)
    if (contentData.title !== undefined) updateData.title = contentData.title;
    if (contentData.body !== undefined)
      updateData.body = contentData.body ?? null;
    if (contentData.contentType !== undefined)
      updateData.contentType = contentData.contentType;
    if (contentData.resourceUrl !== undefined)
      updateData.resourceUrl = contentData.resourceUrl ?? null;

    // Handle hierarchy update
    if (hierarchyId !== undefined) {
      if (hierarchyId === null || hierarchyId === '') {
        updateData.hierarchy = { disconnect: true };
      } else {
        updateData.hierarchy = { connect: { id: hierarchyId } };
      }
    }

    // Handle tags update
    if (tags !== undefined) {
      if (tags.length === 0) {
        // Remove all tags
        updateData.tags = { deleteMany: {} };
      } else {
        // Replace all tags with new ones
        updateData.tags = {
          deleteMany: {},
          create: tags.map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName },
              },
            },
          })),
        };
      }
    }

    // Handle metadata update (upsert: update if exists, create if not)
    if (metadata) {
      updateData.metadata = {
        upsert: {
          create: {
            subject: metadata.subject ?? null,
            topic: metadata.topic ?? null,
            difficulty: metadata.difficulty ?? null,
            duration: metadata.duration ?? null,
            prerequisites: metadata.prerequisites ?? null,
          },
          update: {
            subject: metadata.subject ?? undefined,
            topic: metadata.topic ?? undefined,
            difficulty: metadata.difficulty ?? undefined,
            duration: metadata.duration ?? undefined,
            prerequisites: metadata.prerequisites ?? undefined,
          },
        },
      };
    }

    return this.prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        metadata: true,
      },
    });
  }

  /**
   * Archive content with ownership check (FR-LCM-07)
   */
  async archive(id: string, userId?: string, userRoles?: string[]) {
    const content = await this.findOne(id);

    // Security check: Only author, ADMIN, or INSTRUCTOR can archive
    if (userId) {
      const isAuthor = content.authorId === userId;
      const isAdmin = userRoles?.includes('ADMIN');
      const isInstructor = userRoles?.includes('INSTRUCTOR');

      if (!isAuthor && !isAdmin && !isInstructor) {
        throw new ForbiddenException(
          'You can only archive your own content or have ADMIN/INSTRUCTOR role',
        );
      }
    }

    return this.prisma.content.update({
      where: { id },
      data: { isArchived: true, archivedAt: new Date() },
    });
  }

  /**
   * Restore archived content (FR-LCM-07)
   * Only ADMIN or INSTRUCTOR can restore
   */
  async restore(id: string, userRoles?: string[]) {
    await this.findOne(id);

    // Security check: Only ADMIN or INSTRUCTOR can restore
    if (userRoles) {
      const isAdmin = userRoles.includes('ADMIN');
      const isInstructor = userRoles.includes('INSTRUCTOR');

      if (!isAdmin && !isInstructor) {
        throw new ForbiddenException(
          'Only ADMIN or INSTRUCTOR can restore archived content',
        );
      }
    }

    return this.prisma.content.update({
      where: { id },
      data: { isArchived: false, archivedAt: null },
    });
  }

  /**
   * Check if user can access content (FR-LCM-07)
   * Used for security checks
   */
  async canUserAccessContent(
    contentId: string,
    userId: string,
    userRoles: string[],
  ): Promise<boolean> {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: { authorId: true, isArchived: true },
    });

    if (!content) return false;

    // Author can always access
    if (content.authorId === userId) return true;

    // ADMIN and INSTRUCTOR can access
    if (userRoles.includes('ADMIN') || userRoles.includes('INSTRUCTOR'))
      return true;

    // STUDENT can only access published (non-archived) content
    if (userRoles.includes('STUDENT') && !content.isArchived) return true;

    return false;
  }
}
