import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ContentV2Service } from './content-v2.service';
import { ContentV2Controller } from './content-v2.controller';
import { DatabaseModule } from '@app/database';
import { FilesModule } from '../files/files.module';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { VersioningService } from '../content/versioning.service';

@Module({
  imports: [DatabaseModule, FilesModule, PassportModule, ConfigModule],
  controllers: [ContentV2Controller],
  providers: [ContentV2Service, JwtStrategy, VersioningService],
  exports: [ContentV2Service, VersioningService],
})
export class ContentV2Module {}
