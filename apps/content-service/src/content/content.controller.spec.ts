/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/types/auth.types';

describe('ContentController', () => {
  let controller: ContentController;
  let service: jest.Mocked<ContentService>;

  const mockContent = {
    id: 'content-id-1',
    title: 'Test Content',
    body: 'Test body',
    contentType: 'VIDEO',
    resourceUrl: null,
    authorId: 'author-id-1',
    hierarchyId: null,
    isArchived: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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

  const mockContentWithCount = {
    ...mockContent,
    _count: {
      versions: 0,
    },
  };

  const mockUser: AuthenticatedUser = {
    userId: 'user-id-1',
    email: 'user@example.com',
    roles: ['INSTRUCTOR'],
    permissions: ['CREATE:CONTENT', 'UPDATE:CONTENT', 'DELETE:CONTENT'],
  };

  const createMockRequest = (user: AuthenticatedUser): AuthenticatedRequest => {
    return {
      user,
    } as AuthenticatedRequest;
  };

  const mockRequest = createMockRequest(mockUser);

  const mockContentService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
    canUserAccessContent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentController],
      providers: [
        {
          provide: ContentService,
          useValue: mockContentService,
        },
      ],
    }).compile();

    controller = module.get<ContentController>(ContentController);
    service = module.get(ContentService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateContentDto = {
      title: 'New Content',
      contentType: 'TEXT',
    };

    it('should create content successfully', async () => {
      service.create.mockResolvedValue(mockContent as never);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.userId);
      expect(result).toEqual(mockContent);
    });
  });

  describe('findAll - Search & Filter (FR-LCM-06)', () => {
    const mockResult = {
      data: [mockContentWithCount],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    it('should return paginated content list', async () => {
      const query: QueryContentDto = {
        page: 1,
        limit: 10,
      };
      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });

    it('should support search query', async () => {
      const query: QueryContentDto = {
        search: 'machine learning',
      };
      service.findAll.mockResolvedValue(mockResult);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should support multiple filters', async () => {
      const query: QueryContentDto = {
        type: 'VIDEO',
        tags: ['programming'],
        authorId: 'author-id-1',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      service.findAll.mockResolvedValue(mockResult);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return content by id', async () => {
      service.findOne.mockResolvedValue(mockContent as never);
      service.canUserAccessContent.mockResolvedValue(true);

      const result = await controller.findOne('content-id-1', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('content-id-1');
      expect(result).toEqual(mockContent);
    });

    it('should return content even if user is not authenticated', async () => {
      service.findOne.mockResolvedValue(mockContent as never);

      const result = await controller.findOne('content-id-1', undefined);

      expect(service.findOne).toHaveBeenCalledWith('content-id-1');
      expect(result).toEqual(mockContent);
    });

    it('should throw NotFoundException if content not found', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Content not found'),
      );

      await expect(
        controller.findOne('non-existent-id', undefined),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update - Security (FR-LCM-07)', () => {
    const updateDto: UpdateContentDto = {
      title: 'Updated Title',
    };

    it('should update content if user is authorized', async () => {
      const updatedContent = {
        ...mockContent,
        ...updateDto,
        author: mockContent.author,
        tags: mockContent.tags,
        metadata: mockContent.metadata,
      };
      service.update.mockResolvedValue(updatedContent as never);

      const result = await controller.update(
        'content-id-1',
        updateDto,
        mockRequest,
      );

      expect(service.update).toHaveBeenCalledWith(
        'content-id-1',
        updateDto,
        mockUser.userId,
        mockUser.roles,
      );
      expect(result).toEqual(updatedContent);
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      service.update.mockRejectedValue(
        new ForbiddenException('You can only update your own content'),
      );

      await expect(
        controller.update('content-id-1', updateDto, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('archive - Security (FR-LCM-07)', () => {
    it('should archive content if user is authorized', async () => {
      service.archive.mockResolvedValue(undefined as never);

      await controller.archive('content-id-1', mockRequest);

      expect(service.archive).toHaveBeenCalledWith(
        'content-id-1',
        mockUser.userId,
        mockUser.roles,
      );
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      service.archive.mockRejectedValue(
        new ForbiddenException('You can only archive your own content'),
      );

      await expect(
        controller.archive('content-id-1', mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('restore - Security (FR-LCM-07)', () => {
    it('should restore content if user is ADMIN', async () => {
      const adminUser: AuthenticatedUser = {
        ...mockUser,
        roles: ['ADMIN'],
      };
      const adminRequest = createMockRequest(adminUser);
      service.restore.mockResolvedValue(mockContent as never);

      const result = await controller.restore('content-id-1', adminRequest);

      expect(service.restore).toHaveBeenCalledWith('content-id-1', ['ADMIN']);
      expect(result).toEqual(mockContent);
    });

    it('should restore content if user is INSTRUCTOR', async () => {
      service.restore.mockResolvedValue(mockContent as never);

      const result = await controller.restore('content-id-1', mockRequest);

      expect(service.restore).toHaveBeenCalledWith(
        'content-id-1',
        mockUser.roles,
      );
      expect(result).toEqual(mockContent);
    });

    it('should throw ForbiddenException if user is not ADMIN or INSTRUCTOR', async () => {
      const studentUser: AuthenticatedUser = {
        ...mockUser,
        roles: ['STUDENT'],
      };
      const studentRequest = createMockRequest(studentUser);
      service.restore.mockRejectedValue(
        new ForbiddenException('Only ADMIN or INSTRUCTOR can restore'),
      );

      await expect(
        controller.restore('content-id-1', studentRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
