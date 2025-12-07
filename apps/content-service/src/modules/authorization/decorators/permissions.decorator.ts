import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 * Use with PermissionsGuard
 * 
 * @example
 * // Single permission
 * @RequirePermissions('CREATE:CONTENT')
 * 
 * @example
 * // Multiple permissions (ALL required)
 * @RequirePermissions('UPDATE:CONTENT', 'PUBLISH:CONTENT')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

