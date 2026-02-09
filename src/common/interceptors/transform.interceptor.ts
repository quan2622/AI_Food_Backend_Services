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
      map((data) => {
        const customMessage = this.reflector.get<string>(
          RESPONSE_MESSAGE_KEY,
          context.getHandler(),
        );

        if (this.isFormattedResponse(data)) {
          return {
            statusCode: response.statusCode,
            message: customMessage || data.message || 'Success',
            EC: data.EC || 0,
            data: data.data,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        return {
          statusCode: response.statusCode,
          message: customMessage || 'Success',
          EC: 0,
          data: data,
          timestamp: new Date().toISOString(),
          path: request.url,
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
