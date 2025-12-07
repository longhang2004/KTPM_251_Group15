import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';

import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * Shared Authentication Module
 * Provides JWT authentication strategy and guards for all content-service modules
 * 
 * @decorator @Global - Makes this module available to all other modules without explicit imports
 */
@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    DatabaseModule,
  ],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [JwtStrategy, JwtAuthGuard, PassportModule],
})
export class AuthModule {}

