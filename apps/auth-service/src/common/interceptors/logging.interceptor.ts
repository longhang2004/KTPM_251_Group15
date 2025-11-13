import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor để log các request (có thể mở rộng để ghi audit log)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      url?: string;
    }>();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<{
          statusCode?: number;
        }>();
        const { statusCode } = response;
        const delay = Date.now() - now;
        console.log(
          `${method ?? 'UNKNOWN'} ${url ?? 'UNKNOWN'} ${statusCode ?? 'UNKNOWN'} - ${delay}ms`,
        );
      }),
    );
  }
}
