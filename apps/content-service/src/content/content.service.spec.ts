/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { PrismaService } from '@app/database';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';

describe('ContentService', () => {
  let service: ContentService;
  let prisma: jest.Mocked<PrismaService>;

  const mockContent = {
    id: 'content-id-1',
    title: 'Test Content',
    body: 'Test body',
    contentType: 'VIDEO',
    resourceUrl: 'https://example.com/video.mp4',
    authorId: 'author-id-1',
    hierarchyId: null,
    isArchived: false,
    archivedAt: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    author: {
      id: 'author-id-1',
      email: 'author@example.com',
      fullName: 'Author Name',
    },
    tags: [],
    metadata: null,
    hierarchy: null,
    versions: [],
  };

  const mockPrismaService = {
    content: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateContentDto = {
      title: 'New Content',
      body: 'Content body',
      contentType: 'TEXT',
      resourceUrl: null,
    };

    it('should create content successfully', async () => {
      const authorId = 'author-id-1';
      prisma.content.create.mockResolvedValue(mockContent);

      const result = await service.create(createDto, authorId);

      expect(prisma.content.create).toHaveBeenCalledWith({
        data: {
          title: createDto.title,
          body: createDto.body ?? null,
          contentType: createDto.contentType,
          resourceUrl: createDto.resourceUrl ?? null,
          author: {
            connect: { id: authorId },
          },
        },
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
      expect(result).toEqual(mockContent);
    });

    it('should throw BadRequestException on create error', async () => {
      const authorId = 'author-id-1';
      prisma.content.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createDto, authorId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll - Search & Filter (FR-LCM-06)', () => {
    const mockContents = [mockContent];
    const mockTotal = 1;

    beforeEach(() => {
      prisma.content.findMany.mockResolvedValue(mockContents);
      prisma.content.count.mockResolvedValue(mockTotal);
    });

    it('should return all content with default pagination', async () => {
      const query: QueryContentDto = {};

      const result = await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith({
        where: { isArchived: false },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      expect(result).toEqual({
        data: mockContents,
        pagination: {
          page: 1,
          limit: 10,
          total: mockTotal,
          totalPages: 1,
        },
      });
    });

    it('should filter by search keyword', async () => {
      const query: QueryContentDto = {
        search: 'machine learning',
      };

      await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'machine learning', mode: 'insensitive' } },
              { body: { contains: 'machine learning', mode: 'insensitive' } },
            ],
            isArchived: false,
          }),
        }),
      );
    });

    it('should filter by content type', async () => {
      const query: QueryContentDto = {
        type: 'VIDEO',
      };

      await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentType: 'VIDEO',
            isArchived: false,
          }),
        }),
      );
    });

    it('should filter by status (ARCHIVED)', async () => {
      const query: QueryContentDto = {
        status: 'ARCHIVED',
      };

      await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isArchived: true,
          }),
        }),
      );
    });

    it('should filter by author', async () => {
      const query: QueryContentDto = {
        authorId: 'author-id-1',
      };

      await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: 'author-id-1',
            isArchived: false,
          }),
        }),
      );
    });

    it('should filter by tags', async () => {
      const query: QueryContentDto = {
        tags: ['programming', 'algorithms'],
      };

      await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: {
              some: {
                tag: {
                  name: {
                    in: ['programming', 'algorithms'],
                    mode: 'insensitive',
                  },
                },
              },
            },
            isArchived: false,
          }),
        }),
      );
    });

    it('should filter by hierarchy', async () => {
      const query: QueryContentDto = {
        hierarchyId: 'hierarchy-id-1',
      };

      await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            hierarchyId: 'hierarchy-id-1',
            isArchived: false,
          }),
        }),
      );
    });

    it('should filter by metadata (subject, topic, difficulty)', async () => {
      const query: QueryContentDto = {
        subject: 'Computer Science',
        topic: 'Machine Learning',
        difficulty: 'BEGINNER',
      };

      await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            metadata: {
              subject: { contains: 'Computer Science', mode: 'insensitive' },
              topic: { contains: 'Machine Learning', mode: 'insensitive' },
              difficulty: 'BEGINNER',
            },
            isArchived: false,
          }),
        }),
      );
    });

    it('should support pagination', async () => {
      const query: QueryContentDto = {
        page: 2,
        limit: 20,
      };

      await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page - 1) * limit
          take: 20,
        }),
      );
    });

    it('should support sorting', async () => {
      const query: QueryContentDto = {
        sortBy: 'title',
        sortOrder: 'asc',
      };

      await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' },
        }),
      );
    });

    it('should include archived content when requested', async () => {
      const query: QueryContentDto = {
        includeArchived: 'true',
      };

      await service.findAll(query);

      expect(prisma.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            isArchived: expect.anything(),
          }),
        }),
      );
    });

    it('should throw BadRequestException on error', async () => {
      const query: QueryContentDto = {};
      prisma.content.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll(query)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return content by id', async () => {
      prisma.content.findUnique.mockResolvedValue(mockContent);

      const result = await service.findOne('content-id-1');

      expect(prisma.content.findUnique).toHaveBeenCalledWith({
        where: { id: 'content-id-1' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockContent);
    });

    it('should throw NotFoundException if content not found', async () => {
      prisma.content.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update - Security (FR-LCM-07)', () => {
    const updateDto: UpdateContentDto = {
      title: 'Updated Title',
    };

    beforeEach(() => {
      prisma.content.findUnique.mockResolvedValue(mockContent);
      prisma.content.update.mockResolvedValue({
        ...mockContent,
        ...updateDto,
      });
    });

    it('should update content if user is author', async () => {
      const userId = 'author-id-1';
      const userRoles = ['STUDENT'];

      const result = await service.update(
        'content-id-1',
        updateDto,
        userId,
        userRoles,
      );

      expect(prisma.content.update).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should update content if user is ADMIN', async () => {
      const userId = 'other-user-id';
      const userRoles = ['ADMIN'];

      const result = await service.update(
        'content-id-1',
        updateDto,
        userId,
        userRoles,
      );

      expect(prisma.content.update).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should update content if user is INSTRUCTOR', async () => {
      const userId = 'other-user-id';
      const userRoles = ['INSTRUCTOR'];

      const result = await service.update(
        'content-id-1',
        updateDto,
        userId,
        userRoles,
      );

      expect(prisma.content.update).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException if user is not author, ADMIN, or INSTRUCTOR', async () => {
      const userId = 'other-user-id';
      const userRoles = ['STUDENT'];

      await expect(
        service.update('content-id-1', updateDto, userId, userRoles),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if content not found', async () => {
      prisma.content.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateDto, 'user-id', ['ADMIN']),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive - Security (FR-LCM-07)', () => {
    beforeEach(() => {
      prisma.content.findUnique.mockResolvedValue(mockContent);
      prisma.content.update.mockResolvedValue({
        ...mockContent,
        isArchived: true,
        archivedAt: new Date(),
      });
    });

    it('should archive content if user is author', async () => {
      const userId = 'author-id-1';
      const userRoles = ['STUDENT'];

      await service.archive('content-id-1', userId, userRoles);

      expect(prisma.content.update).toHaveBeenCalledWith({
        where: { id: 'content-id-1' },
        data: { isArchived: true, archivedAt: expect.any(Date) },
      });
    });

    it('should archive content if user is ADMIN', async () => {
      const userId = 'other-user-id';
      const userRoles = ['ADMIN'];

      await service.archive('content-id-1', userId, userRoles);

      expect(prisma.content.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      const userId = 'other-user-id';
      const userRoles = ['STUDENT'];

      await expect(
        service.archive('content-id-1', userId, userRoles),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('restore - Security (FR-LCM-07)', () => {
    beforeEach(() => {
      prisma.content.findUnique.mockResolvedValue(mockContent);
      prisma.content.update.mockResolvedValue({
        ...mockContent,
        isArchived: false,
        archivedAt: null,
      });
    });

    it('should restore content if user is ADMIN', async () => {
      const userRoles = ['ADMIN'];

      await service.restore('content-id-1', userRoles);

      expect(prisma.content.update).toHaveBeenCalledWith({
        where: { id: 'content-id-1' },
        data: { isArchived: false, archivedAt: null },
      });
    });

    it('should restore content if user is INSTRUCTOR', async () => {
      const userRoles = ['INSTRUCTOR'];

      await service.restore('content-id-1', userRoles);

      expect(prisma.content.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not ADMIN or INSTRUCTOR', async () => {
      const userRoles = ['STUDENT'];

      await expect(service.restore('content-id-1', userRoles)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('canUserAccessContent - Security (FR-LCM-07)', () => {
    it('should return true if user is author', async () => {
      prisma.content.findUnique.mockResolvedValue({
        authorId: 'author-id-1',
        isArchived: false,
      });

      const result = await service.canUserAccessContent(
        'content-id-1',
        'author-id-1',
        ['STUDENT'],
      );

      expect(result).toBe(true);
    });

    it('should return true if user is ADMIN', async () => {
      prisma.content.findUnique.mockResolvedValue({
        authorId: 'other-author-id',
        isArchived: true,
      });

      const result = await service.canUserAccessContent(
        'content-id-1',
        'admin-id',
        ['ADMIN'],
      );

      expect(result).toBe(true);
    });

    it('should return true if user is INSTRUCTOR', async () => {
      prisma.content.findUnique.mockResolvedValue({
        authorId: 'other-author-id',
        isArchived: false,
      });

      const result = await service.canUserAccessContent(
        'content-id-1',
        'instructor-id',
        ['INSTRUCTOR'],
      );

      expect(result).toBe(true);
    });

    it('should return true if user is STUDENT and content is not archived', async () => {
      prisma.content.findUnique.mockResolvedValue({
        authorId: 'other-author-id',
        isArchived: false,
      });

      const result = await service.canUserAccessContent(
        'content-id-1',
        'student-id',
        ['STUDENT'],
      );

      expect(result).toBe(true);
    });

    it('should return false if user is STUDENT and content is archived', async () => {
      prisma.content.findUnique.mockResolvedValue({
        authorId: 'other-author-id',
        isArchived: true,
      });

      const result = await service.canUserAccessContent(
        'content-id-1',
        'student-id',
        ['STUDENT'],
      );

      expect(result).toBe(false);
    });

    it('should return false if content not found', async () => {
      prisma.content.findUnique.mockResolvedValue(null);

      const result = await service.canUserAccessContent(
        'non-existent-id',
        'user-id',
        ['STUDENT'],
      );

      expect(result).toBe(false);
    });
  });
});
