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

        // Nếu data đã có format chuẩn (từ service trả về)
        if (this.isFormattedResponse(data)) {
          return {
            statusCode: response.statusCode,
            message: customMessage || data.message || 'Success',
            data: data.data,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        // Format response tiêu chuẩn
        return {
          statusCode: response.statusCode,
          message: customMessage || 'Success',
          data: data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }

  private isFormattedResponse(data: any): boolean {
    return (
      data && typeof data === 'object' && 'message' in data && 'data' in data
    );
  }
}
