import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Converts bracket-notation keys from multipart/form-data into nested objects/arrays.
 * Example: { 'nutritionValues[0][nutrientId]': '2' } → { nutritionValues: [{ nutrientId: '2' }] }
 */
function parseBracketNotation(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, val] of Object.entries(obj)) {
    // Match: arrayKey[index][prop]  e.g. nutritionValues[0][nutrientId]
    const arrayMatch = key.match(/^([^[]+)\[(\d+)\]\[([^\]]+)\]$/);
    if (arrayMatch) {
      const [, arrayKey, idx, prop] = arrayMatch;
      if (!result[arrayKey]) result[arrayKey] = [];
      const i = Number(idx);
      if (!result[arrayKey][i]) result[arrayKey][i] = {};
      result[arrayKey][i][prop] = val;
      continue;
    }

    // Match: key[index]  e.g. tags[0]
    const simpleArrayMatch = key.match(/^([^[]+)\[(\d+)\]$/);
    if (simpleArrayMatch) {
      const [, arrayKey, idx] = simpleArrayMatch;
      if (!result[arrayKey]) result[arrayKey] = [];
      result[arrayKey][Number(idx)] = val;
      continue;
    }

    result[key] = val;
  }

  return result;
}

@Injectable()
export class FormDataParseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body && typeof request.body === 'object') {
      const hasBracketKeys = Object.keys(request.body).some((k) =>
        /\[/.test(k),
      );
      if (hasBracketKeys) {
        request.body = parseBracketNotation(request.body);
      }
    }

    return next.handle();
  }
}
