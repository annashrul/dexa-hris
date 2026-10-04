import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaMainService } from '../../prisma/prisma-main.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaMainService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'hris-dexa-group-secret-key-2024-please-change',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.employee.findUnique({ where: { id: payload.sub } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      position: user.position,
      phone: user.phone,
      photo: user.photo,
    };
  }
}
