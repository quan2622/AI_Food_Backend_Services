import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiErrorResponse } from '../interfaces/response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const EC = this.getErrorCode(exceptionResponse, status);
    const message = this.getErrorMessage(exceptionResponse);

    const errorResponse: ApiErrorResponse = {
      statusCode: status,
      message,
      EC,
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exceptionResponse: any): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (exceptionResponse.message) {
      if (Array.isArray(exceptionResponse.message)) {
        return exceptionResponse.message.join(', ');
      }
      return exceptionResponse.message;
    }

    return 'Internal server error';
  }

  private getErrorCode(exceptionResponse: any, status: number): number {
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'EC' in exceptionResponse
    ) {
      return (exceptionResponse as { EC: number }).EC;
    }

    const errorCodeMap: Record<number, number> = {
      400: 1, // Bad Request
      401: 2, // Unauthorized
      403: 3, // Forbidden
      404: 4, // Not Found
      409: 5, // Conflict
      422: 6, // Unprocessable Entity
      429: 7, // Too Many Requests
      500: 99, // Internal Server Error
      502: 98, // Bad Gateway
      503: 97, // Service Unavailable
    };

    return errorCodeMap[status] || status;
  }
}
