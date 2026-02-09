import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
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

    const errorResponse: ApiErrorResponse = {
      statusCode: status,
      message: this.getErrorMessage(exceptionResponse),
      error: exception.name,
      errorCode: this.getErrorCode(exceptionResponse),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exceptionResponse: any): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }
    return exceptionResponse.message || 'Internal server error';
  }

  private getErrorCode(exceptionResponse: any): string | undefined {
    if (typeof exceptionResponse === 'object' && exceptionResponse.errorCode) {
      return exceptionResponse.errorCode;
    }
    return undefined;
  }
}
