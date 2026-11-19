import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

type InterceptorResponse = {
  success: boolean;
  error: null;
  message: string;
  data?: unknown;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<InterceptorResponse> {
    return next.handle().pipe(
      map((res) => {
        let message = 'Request successful';
        let data: unknown = res;

        if (isObjectRecord(res) && 'message' in res) {
          const maybeMessage = res.message;
          if (typeof maybeMessage === 'string') {
            message = maybeMessage;
          }

          const rest = { ...res };
          delete rest.message;
          data = Object.keys(rest).length > 0 ? rest : undefined;
        }

        return {
          success: true,
          error: null,
          message,
          data,
        };
      }),
    );
  }
}
