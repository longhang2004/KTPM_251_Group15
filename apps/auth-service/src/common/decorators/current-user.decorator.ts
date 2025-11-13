import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to get current user information from JWT token
 * Usage: @CurrentUser() user
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: unknown }>();
    return request.user;
  },
);
