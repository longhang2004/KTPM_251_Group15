import { SetMetadata } from '@nestjs/common';
import { RoleName } from '@prisma/client';

export const ROLES_KEY = 'roles';
/**
 * Decorator để bảo vệ route với roles cụ thể
 * Sử dụng: @Roles(RoleName.ADMIN, RoleName.INSTRUCTOR)
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
