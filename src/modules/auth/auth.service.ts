import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { User } from '../../generated/prisma/client.js';
import { JwtService } from '@nestjs/jwt';

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

  login(user: Omit<User, 'password'>) {
    const payload = { email: user.email, id: user.id, isAdmin: user.isAdmin };

    return {
      message: 'Đăng nhập thành công',
      access_token: this.jwtService.sign(payload),
    };
  }
}
