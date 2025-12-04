import { Module, Global } from '@nestjs/common';
import { PermissionsGuard } from './guards/permissions.guard';

/**
 * Authorization Module
 * Provides permission-based access control for all modules
 */
@Global()
@Module({
  providers: [PermissionsGuard],
  exports: [PermissionsGuard],
})
export class AuthorizationModule {}

