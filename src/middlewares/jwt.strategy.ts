import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '@/modules/users/users.service';
import { UserAuthPayload } from '@types-local/index.type';

@Injectable()
export class JwtStategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  async validate(payload: UserAuthPayload) {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    if (!user.status) {
      await this.usersService.clearTokens(user.id);
      throw new UnauthorizedException(
        'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên',
      );
    }

    return {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };
  }
}
