// apps/auth-service/src/rbac/guards/permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import {
  PERMISSIONS_KEY,
  PermissionRequirement,
} from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector, // Công cụ để đọc metadata (cái nhãn)
    private rbacService: RbacService, // Inject Service để check DB
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Đọc metadata từ Handler (function) hoặc Class (controller)
    const requiredPermission =
      this.reflector.getAllAndOverride<PermissionRequirement>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    // Nếu API không gắn nhãn @RequirePermissions -> Cho qua luôn (Public logic)
    if (!requiredPermission) {
      return true;
    }

    // 2. Lấy User từ Request
    // LƯU Ý: Request này phải đi qua JwtAuthGuard trước thì mới có user!
    const { user } = context.switchToHttp().getRequest();

    // Nếu không có user (chưa đăng nhập) -> Lỗi 401
    if (!user || !user.id) {
      throw new UnauthorizedException(
        'User not identified. Please login first.',
      );
    }

    // 3. Gọi RBAC Service để kiểm tra quyền (Core Logic)
    console.log(
      `🛡️ Checking permission for User [${user.id}]: requires [${requiredPermission.action}] on [${requiredPermission.subject}]`,
    );

    const hasAccess = await this.rbacService.checkAccess(
      user.id,
      requiredPermission.action,
      requiredPermission.subject,
    );

    // 4. Nếu không có quyền -> Lỗi 403 Forbidden
    if (!hasAccess) {
      throw new ForbiddenException(
        `Access Denied: You need permission to ${requiredPermission.action} ${requiredPermission.subject}`,
      );
    }

    return true;
  }
}
