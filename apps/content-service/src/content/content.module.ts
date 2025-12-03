import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';

import { DatabaseModule } from '@app/database';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { JwtStrategy } from '../common/auth/jwt.strategy';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret123',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [ContentController],
  providers: [ContentService, JwtAuthGuard, JwtStrategy],
})
export class ContentModule {}
