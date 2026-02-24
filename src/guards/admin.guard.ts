import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { isAdmin?: boolean } }>();
    const user = request.user;

    if (!user || !user.isAdmin) {
      throw new ForbiddenException(
        'Chỉ admin mới có quyền thực hiện thao tác này',
      );
    }

    return true;
  }
}
