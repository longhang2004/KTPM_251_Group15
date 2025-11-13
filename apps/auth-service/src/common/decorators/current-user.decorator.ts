import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator để lấy thông tin user hiện tại từ JWT token
 * Sử dụng: @CurrentUser() user
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: unknown }>();
    return request.user;
  },
);
