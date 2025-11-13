import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // No specific role required
    }

    const request = context.switchToHttp().getRequest<{
      user?: {
        roles?: Array<{ role: { name: RoleName } }>;
      };
    }>();
    const user = request.user;

    if (!user || !user.roles) {
      return false;
    }

    // Check if user has any role in the requiredRoles list
    const userRoles = user.roles.map(
      (roleOnUser: { role: { name: RoleName } }) => roleOnUser.role.name,
    );

    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
