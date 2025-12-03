import { validate } from 'class-validator';
import { RefreshTokenDto } from './refresh-token.dto';
import { ChangePasswordDto } from './change-password.dto';
import { ForgotPasswordDto } from './forgot-password.dto';
import { ResetPasswordDto } from './reset-password.dto';
import { RegisterDto } from './register-auth.dto';
import { LoginDto } from './login-auth.dto';

describe('Auth DTOs Validation', () => {
  describe('RefreshTokenDto', () => {
    it('should pass validation with valid refresh token', async () => {
      const dto = new RefreshTokenDto();
      dto.refreshToken = 'valid.refresh.token';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty refresh token', async () => {
      const dto = new RefreshTokenDto();
      dto.refreshToken = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('refreshToken');
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should fail validation with missing refresh token', async () => {
      const dto = new RefreshTokenDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('refreshToken');
    });
  });

  describe('ChangePasswordDto', () => {
    it('should pass validation with valid passwords', async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = 'currentPassword123';
      dto.newPassword = 'newPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with short new password', async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = 'currentPassword123';
      dto.newPassword = '123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should fail validation with empty current password', async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = '';
      dto.newPassword = 'newPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('currentPassword');
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should fail validation with empty new password', async () => {
      const dto = new ChangePasswordDto();
      dto.currentPassword = 'currentPassword123';
      dto.newPassword = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1); // Both constraints are on the same property
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
      expect(errors[0].constraints?.minLength).toBeDefined();
    });
  });

  describe('ForgotPasswordDto', () => {
    it('should pass validation with valid email', async () => {
      const dto = new ForgotPasswordDto();
      dto.email = 'test@example.com';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email format', async () => {
      const dto = new ForgotPasswordDto();
      dto.email = 'invalid-email';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should fail validation with empty email', async () => {
      const dto = new ForgotPasswordDto();
      dto.email = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1); // Both constraints are on the same property
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });
  });

  describe('ResetPasswordDto', () => {
    it('should pass validation with valid token and password', async () => {
      const dto = new ResetPasswordDto();
      dto.token = 'valid-reset-token';
      dto.newPassword = 'newPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty token', async () => {
      const dto = new ResetPasswordDto();
      dto.token = '';
      dto.newPassword = 'newPassword123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('token');
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should fail validation with short password', async () => {
      const dto = new ResetPasswordDto();
      dto.token = 'valid-reset-token';
      dto.newPassword = '123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints?.minLength).toBeDefined();
    });
  });

  describe('RegisterDto', () => {
    it('should pass validation with valid registration data', async () => {
      const dto = new RegisterDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.fullName = 'Test User';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = new RegisterDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';
      dto.fullName = 'Test User';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });
  });

  describe('LoginDto', () => {
    it('should pass validation with valid login data', async () => {
      const dto = new LoginDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email', async () => {
      const dto = new LoginDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });

    it('should fail validation with empty password', async () => {
      const dto = new LoginDto();
      dto.email = 'test@example.com';
      dto.password = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });
  });
});
