// apps/auth-service/src/rbac/rbac.module.ts
import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { DatabaseModule } from '@app/database'; // Import Database Module

@Module({
  imports: [DatabaseModule], // Cần cái này để dùng PrismaService
  controllers: [RbacController],
  providers: [RbacService],
  exports: [RbacService], // Export để AuthModule hoặc các Guard có thể dùng
})
export class RbacModule {}
