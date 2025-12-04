import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get(
      'JWT_SECRET',
      'ugugugaggagagxbsbcbjdscjwedwe',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const { sub: userId } = payload;

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Verify user exists in database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get permissions from user roles
    const permissions = user.roles.flatMap(
      (roleOnUser) =>
        roleOnUser.role.permissions?.map(
          (permOnRole) =>
            `${permOnRole.permission.action}:${permOnRole.permission.subject}`,
        ) || [],
    );

    return {
      userId: user.id,  // Changed from 'id' to 'userId' for consistency
      email: user.email,
      fullName: user.fullName,
      roles: user.roles.map((r) => r.role.name),
      permissions: permissions,
    };
  }
}
