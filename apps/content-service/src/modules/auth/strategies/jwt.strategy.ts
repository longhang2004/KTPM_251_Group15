import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/database';

/**
 * JWT Payload interface returned by validate()
 */
export interface JwtPayload {
  userId: string;
  email: string;
  fullName: string | null;
  roles: string[];
  permissions: string[];
}

/**
 * JWT Authentication Strategy
 * Validates JWT tokens and enriches request with user data
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Validates JWT payload and returns user with roles/permissions
   * This data is attached to request.user
   */
  async validate(payload: { sub: string; email: string }): Promise<JwtPayload> {
    const { sub: userId } = payload;

    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Fetch user with roles and permissions
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

    // Extract permissions as "ACTION:SUBJECT" strings
    const permissions = user.roles.flatMap(
      (roleOnUser) =>
        roleOnUser.role.permissions?.map(
          (permOnRole) =>
            `${permOnRole.permission.action}:${permOnRole.permission.subject}`,
        ) || [],
    );

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles.map((r) => r.role.name),
      permissions,
    };
  }
}

