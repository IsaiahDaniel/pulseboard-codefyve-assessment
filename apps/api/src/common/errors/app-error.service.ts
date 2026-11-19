import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Common domain errors — use instead of `throw new XxxException` in services.
 * Inject as `private readonly errors: AppErrorService` → `this.errors.badRequest(...)`.
 */
@Injectable()
export class AppErrorService {
  notFound(resource: string): never {
    throw new NotFoundException(`${resource} not found`);
  }

  badRequest(message: string): never {
    throw new BadRequestException(message);
  }

  conflict(message: string): never {
    throw new ConflictException(message);
  }

  unauthorized(message = 'Unauthorized'): never {
    throw new UnauthorizedException(message);
  }

  forbidden(message = 'Forbidden'): never {
    throw new ForbiddenException(message);
  }

  internal(message = 'Internal server error'): never {
    throw new InternalServerErrorException(message);
  }
}
