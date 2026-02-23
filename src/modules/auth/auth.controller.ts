import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { UsersService } from '../users/users.service';
import type { User } from '@/generated/prisma/client.js';
import { LocalAuthGuard } from '@/guards/local-auth.guard.js';

export interface RequestWithUser extends ExpressRequest {
  user: Omit<User, 'password'>;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  private setRefreshTokenCookie(
    res: ExpressResponse,
    refreshToken: string,
  ): void {
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.login(req.user);

    this.setRefreshTokenCookie(res, result.data.refresh_token);

    return result;
  }

  @Post('/refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const token =
      (req as any).cookies?.refresh_token ??
      (
        req.headers.cookie &&
        req.headers.cookie
          .split(';')
          .map((c) => c.trim())
          .find((c) => c.startsWith('refresh_token='))
      )?.split('=')[1];

    if (!token) {
      throw new UnauthorizedException('Refresh token không tồn tại');
    }

    const result = await this.authService.refreshTokens(token as string);

    this.setRefreshTokenCookie(res, result.data.refresh_token);

    return result;
  }
}
