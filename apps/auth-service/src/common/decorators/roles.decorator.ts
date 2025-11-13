import { SetMetadata } from '@nestjs/common';
import { RoleName } from '@prisma/client';

export const ROLES_KEY = 'roles';
/**
 * Decorator to protect route with specific roles
 * Usage: @Roles(RoleName.ADMIN, RoleName.INSTRUCTOR)
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
