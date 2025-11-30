/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// Import the new services
import { HashService } from './services/hash.service';
import { CryptoService } from './services/crypto.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let hashService: jest.Mocked<HashService>;
  let cryptoService: jest.Mocked<CryptoService>;

  const mockUser = {
    id: 'user-id-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullName: 'Test User',
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockUserWithoutPassword = {
    id: 'user-id-1',
    email: 'test@example.com',
    fullName: 'Test User',
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  beforeEach(async () => {
    const mockUserService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithPassword: jest.fn(),
      updatePassword: jest.fn(),
      updateResetToken: jest.fn(),
      findByResetToken: jest.fn(),
      resetPassword: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verify: jest.fn(),
      sign: jest.fn(),
      decode: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const mockHashService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const cryptoServiceService = {
      randomBytes: jest.fn(),
      createHash: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: HashService,
          useValue: mockHashService,
        },
        {
          provide: CryptoService,
          useValue: cryptoServiceService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    hashService = module.get(HashService);
    cryptoService = module.get(CryptoService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    };

    it('should register a new user successfully', async () => {
      userService.findByEmail.mockResolvedValue(null);
      hashService.hash.mockResolvedValue('hashedPassword');
      userService.create.mockResolvedValue(mockUserWithoutPassword);
      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.register(registerDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(hashService.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: 'hashedPassword',
        fullName: registerDto.fullName,
      });
      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        user: {
          id: mockUserWithoutPassword.id,
          email: mockUserWithoutPassword.email,
          fullName: mockUserWithoutPassword.fullName,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email already in use'),
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully and return tokens', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      hashService.compare.mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.login(loginDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(hashService.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(hashService.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      hashService.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid email or password'),
      );
      expect(hashService.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid_refresh_token',
    };

    it('should refresh token successfully', async () => {
      const mockPayload = { sub: 'user-id-1', email: 'test@example.com' };
      jwtService.verify.mockReturnValue(mockPayload);
      jwtService.signAsync.mockResolvedValue('new_access_token');

      const result = await service.refreshToken(refreshTokenDto);

      expect(jwtService.verify).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockPayload.sub,
        email: mockPayload.email,
      });
      expect(result).toEqual({
        access_token: 'new_access_token',
        refresh_token: refreshTokenDto.refreshToken,
      });
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if payload is invalid', async () => {
      jwtService.verify.mockReturnValue({ sub: null });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'currentPassword',
      newPassword: 'newPassword123',
    };

    it('should change password successfully', async () => {
      userService.findByIdWithPassword.mockResolvedValue(mockUser);
      hashService.compare.mockResolvedValue(true);
      hashService.hash.mockResolvedValue('newHashedPassword');
      userService.updatePassword.mockResolvedValue(undefined);

      const result = await service.changePassword(
        mockUser.id,
        changePasswordDto,
      );

      expect(userService.findByIdWithPassword).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(hashService.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.password,
      );
      expect(hashService.hash).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
        10,
      );
      expect(userService.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        'newHashedPassword',
      );
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw NotFoundException if user not found', async () => {
      userService.findByIdWithPassword.mockResolvedValue(null);

      await expect(
        service.changePassword(mockUser.id, changePasswordDto),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(hashService.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      userService.findByIdWithPassword.mockResolvedValue(mockUser);
      hashService.compare.mockResolvedValue(false);

      await expect(
        service.changePassword(mockUser.id, changePasswordDto),
      ).rejects.toThrow(
        new UnauthorizedException('Current password is incorrect'),
      );
      expect(userService.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should generate reset token if user exists', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      const mockBuffer = {
        toString: jest.fn().mockReturnValue('randomtoken'),
      } as unknown as Buffer;
      cryptoService.randomBytes.mockReturnValue(mockBuffer);
      const mockDate = new Date('2023-01-01T12:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      userService.updateResetToken.mockResolvedValue(undefined);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
      expect(cryptoService.randomBytes).toHaveBeenCalledWith(32);
      expect(userService.updateResetToken).toHaveBeenCalledWith(
        mockUser.id,
        'randomtoken',
        new Date(mockDate.getTime() + 3600000),
      );
      expect(result).toEqual({
        message: 'Password reset token generated',
        resetToken: 'randomtoken',
      });
    });

    it('should return generic message if user does not exist', async () => {
      userService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
      expect(userService.updateResetToken).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'If the email exists, a reset link has been sent',
      });
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'valid_token',
      newPassword: 'newPassword123',
    };

    const mockUserWithResetToken = {
      ...mockUser,
      resetToken: 'valid_token',
      resetTokenExpiry: new Date(Date.now() + 3600000), // Future date
    };

    it('should reset password successfully', async () => {
      userService.findByResetToken.mockResolvedValue(mockUserWithResetToken);
      hashService.hash.mockResolvedValue('newHashedPassword');
      userService.resetPassword.mockResolvedValue(undefined);

      const result = await service.resetPassword(resetPasswordDto);

      expect(userService.findByResetToken).toHaveBeenCalledWith(
        resetPasswordDto.token,
      );
      expect(hashService.hash).toHaveBeenCalledWith(
        resetPasswordDto.newPassword,
        10,
      );
      expect(userService.resetPassword).toHaveBeenCalledWith(
        mockUserWithResetToken.id,
        'newHashedPassword',
      );
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userService.findByResetToken.mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired reset token'),
      );
      expect(hashService.hash).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      const expiredUser = {
        ...mockUserWithResetToken,
        resetTokenExpiry: new Date(Date.now() - 3600000), // Past date
      };
      userService.findByResetToken.mockResolvedValue(expiredUser);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired reset token'),
      );
      expect(hashService.hash).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if resetTokenExpiry is null', async () => {
      const userWithoutExpiry = {
        ...mockUserWithResetToken,
        resetTokenExpiry: null,
      };
      userService.findByResetToken.mockResolvedValue(userWithoutExpiry);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired reset token'),
      );
      expect(hashService.hash).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      const payload = { sub: 'user-id-1', email: 'test@example.com' };
      userService.findById.mockResolvedValue(mockUserWithoutPassword);

      const result = await service.validateUser(payload);

      expect(userService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = { sub: 'user-id-1', email: 'test@example.com' };
      userService.findById.mockResolvedValue(null);

      await expect(service.validateUser(payload)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
      expect(userService.findById).toHaveBeenCalledWith(payload.sub);
    });
  });
});
