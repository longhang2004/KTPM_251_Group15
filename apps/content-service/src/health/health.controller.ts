import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@app/database';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  healthCheck(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', this.prisma),
    ]);
  }
}
