import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';
import { ApiResponse } from '../interfaces/response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data): ApiResponse<T> => {
        const customMessage = this.reflector.get<string>(
          RESPONSE_MESSAGE_KEY,
          context.getHandler(),
        );

        const baseMetadata = {
          statusCode: response.statusCode,
          message: customMessage || 'Success',
          EC: 0,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        if (this.isFormattedResponse(data)) {
          return {
            metadata: {
              ...baseMetadata,
              message: customMessage || data.message || 'Success',
              EC: data.EC ?? 0,
            },
            data: data.data as T,
          };
        }

        return {
          metadata: baseMetadata,
          data: data as T,
        };
      }),
    );
  }

  private isFormattedResponse(data: any): boolean {
    return (
      data && typeof data === 'object' && 'EC' in data && 'message' in data
    );
  }
}
