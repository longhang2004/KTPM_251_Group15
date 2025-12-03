import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [DatabaseModule],
})
export class UsageModule {}
