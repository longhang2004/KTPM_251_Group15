/* eslint-disable @typescript-eslint/unbound-method */
import { PrismaService } from '@app/database';
import { UserService } from './user.service';
import { Prisma } from '@prisma/client';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-id-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullName: 'Test User',
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: 'user-id-1',
    email: 'test@example.com',
    fullName: 'Test User',
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [],
  };

  beforeEach(() => {
    prismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as PrismaService;

    service = new UserService(prismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user and return user without password', async () => {
      const createUserDto: Prisma.UserCreateInput = {
        email: 'test@example.com',
        password: 'hashedPassword',
        fullName: 'Test User',
      };

      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(prismaService.user.create as jest.Mock).toHaveBeenCalledWith({
        data: createUserDto,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        resetToken: mockUser.resetToken,
        resetTokenExpiry: mockUser.resetTokenExpiry,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id and return user without password', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        roles: [],
      });

      const result = await service.findById('user-id-1');

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
      expect(result).not.toHaveProperty('password');
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should return null if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByIdWithPassword', () => {
    it('should find user by id with password', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByIdWithPassword('user-id-1');

      expect(prismaService.user.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findByIdWithPassword('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByResetToken', () => {
    it('should find user by reset token', async () => {
      const userWithResetToken = {
        ...mockUser,
        resetToken: 'reset-token-123',
        resetTokenExpiry: new Date(Date.now() + 3600000),
      };

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(
        userWithResetToken,
      );

      const result = await service.findByResetToken('reset-token-123');

      expect(prismaService.user.findFirst as jest.Mock).toHaveBeenCalledWith({
        where: { resetToken: 'reset-token-123' },
      });
      expect(result).toEqual(userWithResetToken);
    });

    it('should return null if user not found', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.findByResetToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      await service.updatePassword('user-id-1', 'newHashedPassword');

      expect(prismaService.user.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { password: 'newHashedPassword' },
      });
    });
  });

  describe('updateResetToken', () => {
    it('should update user reset token and expiry', async () => {
      const resetToken = 'reset-token-123';
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetToken,
        resetTokenExpiry,
      });

      await service.updateResetToken('user-id-1', resetToken, resetTokenExpiry);

      expect(prismaService.user.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password and clear reset token fields', async () => {
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'newHashedPassword',
        resetToken: null,
        resetTokenExpiry: null,
      });

      await service.resetPassword('user-id-1', 'newHashedPassword');

      expect(prismaService.user.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: {
          password: 'newHashedPassword',
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
    });
  });

  describe('update', () => {
    it('should update user and return user without password', async () => {
      const updateData: Prisma.UserUpdateInput = {
        fullName: 'Updated Name',
      };

      const updatedUser = {
        ...mockUser,
        fullName: 'Updated Name',
      };

      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update('user-id-1', updateData);

      expect(prismaService.user.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: updateData,
      });
      expect(result).not.toHaveProperty('password');
      expect(result.fullName).toBe('Updated Name');
    });
  });
});
