import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User as UserType} from '../../generated/prisma/client.js';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Omit<UserType, 'password'> => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
