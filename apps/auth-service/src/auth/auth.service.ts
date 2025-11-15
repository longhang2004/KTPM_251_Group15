import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { HashService } from './services/hash.service';
import { CryptoService } from './services/crypto.service';
import { RegisterDto } from './dto/register-auth.dto';
import { LoginDto } from './dto/login-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private hashService: HashService,
    private cryptoService: CryptoService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const hashedPassword = await this.hashService.hash(dto.password, 10);

    // Create new user
    const user = await this.userService.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
    });

    // Create JWT payload
    const payload = { sub: user.id, email: user.email };

    // Sign tokens
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async login(dto: LoginDto) {
    // Find user by email
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await this.hashService.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Create JWT payload
    const payload = { sub: user.id, email: user.email };

    // Sign tokens
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify<{ sub: string; email?: string }>(
        refreshTokenDto.refreshToken,
      );

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const newPayload = { sub: payload.sub, email: payload.email };
      const access_token = await this.jwtService.signAsync(newPayload);

      return {
        access_token,
        refresh_token: refreshTokenDto.refreshToken, // Keep the same refresh token
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userService.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.hashService.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.hashService.hash(
      changePasswordDto.newPassword,
      10,
    );

    // Update password
    await this.userService.updatePassword(userId, hashedNewPassword);

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = this.cryptoService.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to user
    await this.userService.updateResetToken(
      user.id,
      resetToken,
      resetTokenExpiry,
    );

    // Here you would typically send an email with the reset link
    // For development, we'll return the token (remove this in production)
    return {
      message: 'Password reset token generated',
      resetToken: resetToken, // Remove this in production
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userService.findByResetToken(
      resetPasswordDto.token,
    );

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await this.hashService.hash(
      resetPasswordDto.newPassword,
      10,
    );

    // Update password and clear reset token
    await this.userService.resetPassword(user.id, hashedPassword);

    return { message: 'Password reset successfully' };
  }

  async validateUser(payload: { sub: string; email?: string }) {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Return user with roles for JWT strategy to use
    return user;
  }
}
