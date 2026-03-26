import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { User } from '../../generated/prisma/client.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const comparePassword: (data: string, hash: string) => Promise<boolean> = (
  bcrypt as {
    compare: (data: string, hash: string) => Promise<boolean>;
  }
).compare;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.status) {
      return null;
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return null;
    }
    const { password: _pw, ...result } = user;
    return result;
  }

  private getAccessToken(payload: {
    email: string;
    id: number;
    isAdmin: boolean;
  }): string {
    return this.jwtService.sign(payload);
  }

  private getRefreshToken(payload: {
    email: string;
    id: number;
    isAdmin: boolean;
  }): string {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'default-secret-change-in-production';

    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    return this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as
          | `${number}h`
          | `${number}d`
          | `${number}m`,
      },
    );
  }

  async login(user: Omit<User, 'password'>) {
    const payload = { email: user.email, id: user.id, isAdmin: user.isAdmin };

    const accessToken = this.getAccessToken(payload);
    const refreshToken = this.getRefreshToken(payload);

    // Lưu tokens vào database
    await this.usersService.updateTokens(user.id, accessToken, refreshToken);

    return {
      message: 'Đăng nhập thành công',
      EC: 0,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'default-secret-change-in-production';

    try {
      const decoded = await this.jwtService.verifyAsync<{
        email: string;
        id: number;
        isAdmin: boolean;
        type?: string;
      }>(refreshToken, {
        secret: refreshSecret,
      });

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      const user = await this.usersService.findOne(decoded.id);

      const payload = {
        email: user.email,
        id: user.id,
        isAdmin: user.isAdmin,
      };

      const newAccessToken = this.getAccessToken(payload);
      const newRefreshToken = this.getRefreshToken(payload);

      // Lưu tokens mới vào database
      await this.usersService.updateTokens(
        user.id,
        newAccessToken,
        newRefreshToken,
      );

      return {
        message: 'Làm mới token thành công',
        EC: 0,
        data: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        },
      };
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  async logout(userId: number): Promise<object> {
    // Xoá cả access token và refresh token khỏi database
    await this.usersService.clearTokens(userId);

    return {
      message: 'Đăng xuất thành công',
      EC: 0,
    };
  }
}
