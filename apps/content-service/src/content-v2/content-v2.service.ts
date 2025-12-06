import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { FilesService } from '../files/files.service';
import {
  CreateContentV2Dto,
  UpdateContentV2Dto,
  ContentV2ResponseDto,
  ContentV2ListResponseDto,
  QueryContentV2Dto,
  ContentStatusV2,
} from './dto';
import { ResponseDto } from '../common/dto/reponse.dto';
import { File } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ContentV2Service {
  private readonly logger = new Logger(ContentV2Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  async getFirstUser() {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new BadRequestException('No users found in database');
    }
    return user;
  }

  async createContent(
    createContentDto: CreateContentV2Dto,
  ): Promise<ResponseDto<ContentV2ResponseDto>> {
    try {
      // Validate file attachments if provided
      if (createContentDto.fileIds?.length) {
        const existingFiles = await this.prisma.file.findMany({
          where: { fileId: { in: createContentDto.fileIds }, deletedAt: null },
        });

        if (existingFiles.length !== createContentDto.fileIds.length) {
          const foundIds = existingFiles.map((f) => f.fileId);
          const missingIds = createContentDto.fileIds.filter(
            (id) => !foundIds.includes(id),
          );
          throw new BadRequestException(
            `Files not found: ${missingIds.join(', ')}`,
          );
        }
      }

      // Create content with transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Verify user exists (should be provided from JWT token)
        if (!createContentDto.createdBy) {
          throw new BadRequestException(
            'User ID is required (should be provided from JWT token)',
          );
        }

        const userExists = await tx.user.findUnique({
          where: { id: createContentDto.createdBy },
        });
        if (!userExists) {
          throw new BadRequestException(
            `User with ID ${createContentDto.createdBy} not found`,
          );
        }

        // Create content
        const content = await tx.content.create({
          data: {
            title: createContentDto.title,
            body: createContentDto.body,
            contentType: createContentDto.contentType,
            resourceUrl: null,
            authorId: createContentDto.createdBy,
            hierarchyId: null,
            isArchived: createContentDto.status === ContentStatusV2.ARCHIVED,
            // Create metadata if provided
            ...(createContentDto.metadata && {
              metadata: {
                create: {
                  subject: createContentDto.metadata.subject || null,
                  topic: createContentDto.metadata.topic || null,
                  difficulty: createContentDto.metadata.difficulty || null,
                  duration: createContentDto.metadata.duration || null,
                  prerequisites:
                    createContentDto.metadata.prerequisites || null,
                },
              },
            }),
          },
        });

        // Link files to content if provided
        if (createContentDto.fileIds?.length) {
          await tx.file.updateMany({
            where: {
              fileId: { in: createContentDto.fileIds },
            },
            data: {
              contentId: content.id,
            },
          });
        }

        return content;
      });

      // Fetch complete content with relations
      const contentWithRelations = await this.getContentWithRelations(
        result.id,
      );

      return new ResponseDto({
        statusCode: 201,
        message: 'Content created successfully',
        data: this.mapToResponseDto(contentWithRelations),
      });
    } catch (error) {
      this.logger.error(
        `Error creating content: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create content');
    }
  }

  async getContentList(
    queryDto: QueryContentV2Dto,
  ): Promise<ResponseDto<ContentV2ListResponseDto>> {
    try {
      const {
        search,
        contentType,
        status,
        tags,
        createdBy,
        includeArchived = false,
        includeFiles = true,
        includeChildren = false,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = queryDto;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { body: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (contentType) {
        where.contentType = contentType;
      }

      if (status) {
        where.isArchived = status === ContentStatusV2.ARCHIVED;
      } else if (!includeArchived) {
        where.isArchived = false;
      }

      if (tags?.length) {
        where.tags = { hasSome: tags };
      }

      if (createdBy) {
        where.authorId = createdBy;
      }

      // Build include clause
      const include: any = {
        author: {
          select: { id: true, fullName: true, email: true },
        },
        hierarchy: {
          select: { id: true, name: true, type: true },
        },
        metadata: true,
      };

      if (includeFiles) {
        include.files = {
          where: { deletedAt: null },
          select: {
            fileId: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            fileType: true,
            uploadedAt: true,
            bucketName: true,
            objectKey: true,
            checksum: true,
            metadata: true,
          },
        };
      }

      if (includeChildren) {
        include.children = {
          include: {
            creator: { select: { id: true, name: true, email: true } },
            files: includeFiles
              ? {
                  where: { deletedAt: null },
                  select: {
                    fileId: true,
                    fileName: true,
                    filePath: true,
                    fileSize: true,
                    fileType: true,
                    uploadedAt: true,
                  },
                }
              : false,
          },
        };
      }

      // Execute queries
      const [contents, total] = await Promise.all([
        this.prisma.content.findMany({
          where,
          include,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.content.count({ where }),
      ]);

      const responseData: ContentV2ListResponseDto = {
        total,
        contents: contents.map((content) => this.mapToResponseDto(content)),
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      return new ResponseDto({
        statusCode: 200,
        message: 'Content list retrieved successfully',
        data: responseData,
      });
    } catch (error) {
      this.logger.error(
        `Error getting content list: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Failed to retrieve content list');
    }
  }

  async getContentById(id: string): Promise<ResponseDto<ContentV2ResponseDto>> {
    try {
      const content = await this.getContentWithRelations(id);

      if (!content) {
        throw new NotFoundException('Content not found');
      }

      return new ResponseDto({
        statusCode: 200,
        message: 'Content retrieved successfully',
        data: this.mapToResponseDto(content),
      });
    } catch (error) {
      this.logger.error(
        `Error getting content by ID: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve content');
    }
  }

  async updateContent(
    id: string,
    updateContentDto: UpdateContentV2Dto,
  ): Promise<ResponseDto<ContentV2ResponseDto>> {
    try {
      // Check if content exists
      const existingContent = await this.prisma.content.findUnique({
        where: { id },
      });

      if (!existingContent) {
        throw new NotFoundException('Content not found');
      }

      // Validate file attachments if provided
      if (updateContentDto.fileIds?.length) {
        const existingFiles = await this.prisma.file.findMany({
          where: { fileId: { in: updateContentDto.fileIds }, deletedAt: null },
        });

        if (existingFiles.length !== updateContentDto.fileIds.length) {
          const foundIds = existingFiles.map((f) => f.fileId);
          const missingIds = updateContentDto.fileIds.filter(
            (id) => !foundIds.includes(id),
          );
          throw new BadRequestException(
            `Files not found: ${missingIds.join(', ')}`,
          );
        }
      }

      // Update content with transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Update content
        const content = await tx.content.update({
          where: { id },
          data: {
            ...(updateContentDto.title && { title: updateContentDto.title }),
            ...(updateContentDto.body !== undefined && {
              body: updateContentDto.body,
            }),
            ...(updateContentDto.contentType && {
              contentType: updateContentDto.contentType,
            }),
            ...(updateContentDto.status && {
              isArchived: updateContentDto.status === ContentStatusV2.ARCHIVED,
            }),
            // Update metadata if provided
            ...(updateContentDto.metadata && {
              metadata: {
                upsert: {
                  create: {
                    subject: updateContentDto.metadata.subject || null,
                    topic: updateContentDto.metadata.topic || null,
                    difficulty: updateContentDto.metadata.difficulty || null,
                    duration: updateContentDto.metadata.duration || null,
                    prerequisites:
                      updateContentDto.metadata.prerequisites || null,
                  },
                  update: {
                    subject: updateContentDto.metadata.subject || null,
                    topic: updateContentDto.metadata.topic || null,
                    difficulty: updateContentDto.metadata.difficulty || null,
                    duration: updateContentDto.metadata.duration || null,
                    prerequisites:
                      updateContentDto.metadata.prerequisites || null,
                  },
                },
              },
            }),
          },
        });

        // Update file associations if provided
        if (updateContentDto.fileIds !== undefined) {
          // Remove existing file associations
          await tx.file.updateMany({
            where: { contentId: id },
            data: { contentId: null },
          });

          // Add new file associations
          if (updateContentDto.fileIds.length > 0) {
            await tx.file.updateMany({
              where: {
                fileId: { in: updateContentDto.fileIds },
              },
              data: { contentId: id },
            });
          }
        }

        return content;
      });

      // Fetch complete content with relations
      const contentWithRelations = await this.getContentWithRelations(
        result.id,
      );

      return new ResponseDto({
        statusCode: 200,
        message: 'Content updated successfully',
        data: this.mapToResponseDto(contentWithRelations),
      });
    } catch (error) {
      this.logger.error(
        `Error updating content: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update content');
    }
  }

  async archiveContent(id: string): Promise<ResponseDto<null>> {
    try {
      const existingContent = await this.prisma.content.findUnique({
        where: { id },
      });

      if (!existingContent) {
        throw new NotFoundException('Content not found');
      }

      if (existingContent.isArchived) {
        throw new BadRequestException('Content is already archived');
      }

      await this.prisma.content.update({
        where: { id },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });

      return new ResponseDto({
        statusCode: 200,
        message: 'Content archived successfully',
        data: null,
      });
    } catch (error) {
      this.logger.error(
        `Error archiving content: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to archive content');
    }
  }

  async restoreContent(id: string): Promise<ResponseDto<ContentV2ResponseDto>> {
    try {
      const existingContent = await this.prisma.content.findUnique({
        where: { id },
      });

      if (!existingContent) {
        throw new NotFoundException('Content not found');
      }

      if (!existingContent.isArchived) {
        throw new BadRequestException('Content is not archived');
      }

      const restoredContent = await this.prisma.content.update({
        where: { id },
        data: {
          isArchived: false,
          archivedAt: null,
        },
      });

      // Fetch complete content with relations
      const contentWithRelations = await this.getContentWithRelations(
        restoredContent.id,
      );

      return new ResponseDto({
        statusCode: 200,
        message: 'Content restored successfully',
        data: this.mapToResponseDto(contentWithRelations),
      });
    } catch (error) {
      this.logger.error(
        `Error restoring content: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to restore content');
    }
  }

  private async getContentWithRelations(id: string) {
    return this.prisma.content.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, fullName: true, email: true },
        },
        hierarchy: {
          select: {
            id: true,
            name: true,
            type: true,
            parent: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        metadata: true,
        files: {
          where: { deletedAt: null },
          select: {
            fileId: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            fileType: true,
            uploadedAt: true,
            updatedAt: true,
            bucketName: true,
            objectKey: true,
            checksum: true,
            metadata: true,
          },
        },
      },
    });
  }

  private mapToResponseDto(content: any): ContentV2ResponseDto {
    const fileCount = content.files?.length || 0;
    const totalFileSize =
      content.files?.reduce(
        (sum: number, file: any) => sum + (file.fileSize || 0),
        0,
      ) || 0;

    // Map status from isArchived boolean to ContentStatusV2 enum
    const status = content.isArchived
      ? ContentStatusV2.ARCHIVED
      : ContentStatusV2.PUBLISHED; // Default to PUBLISHED for active content

    const responseDto = plainToInstance(ContentV2ResponseDto, {
      id: content.id,
      title: content.title,
      description: null, // Not in current schema
      contentType: content.contentType,
      status: status,
      body: content.body,
      metadata: content.metadata
        ? {
            subject: content.metadata.subject,
            topic: content.metadata.topic,
            difficulty: content.metadata.difficulty,
            duration: content.metadata.duration,
            prerequisites: content.metadata.prerequisites,
          }
        : null,
      tags: [], // Tags are in separate relation, would need separate query
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      archivedAt: content.archivedAt,
      createdBy: content.authorId,
      creator: content.author
        ? {
            id: content.author.id,
            name: content.author.fullName,
            email: content.author.email,
          }
        : null,
      updatedBy: null, // Not in current schema
      updater: null,
      archivedBy: null, // Not in current schema
      archiver: null,
      fileCount,
      totalFileSize,
      attachments:
        content.files?.map((file: any) => ({
          fileId: file.fileId,
          file: {
            fileId: file.fileId,
            fileName: file.fileName,
            filePath: file.filePath,
            fileSize: file.fileSize,
            fileType: file.fileType,
            uploadedAt: file.uploadedAt,
            updatedAt: file.updatedAt,
            bucketName: file.bucketName,
            objectKey: file.objectKey,
            checksum: file.checksum,
            metadata: file.metadata,
          },
        })) || [],
    });

    return responseDto;
  }
}
