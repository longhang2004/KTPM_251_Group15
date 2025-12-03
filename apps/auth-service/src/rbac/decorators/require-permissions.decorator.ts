// apps/auth-service/src/rbac/decorators/require-permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

// Key dùng để lưu trữ metadata (như một cái chìa khóa bí mật)
export const PERMISSIONS_KEY = 'permissions';

// Định nghĩa cấu trúc của quyền: Cần Action gì? Trên đối tượng nào?
export interface PermissionRequirement {
  action: string;
  subject: string;
}

/**
 * Decorator dùng để yêu cầu quyền hạn cho một endpoint.
 * Ví dụ: @RequirePermissions('DELETE', 'USER')
 */
export const RequirePermissions = (action: string, subject: string) =>
  SetMetadata(PERMISSIONS_KEY, { action, subject });
