import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { VersioningService } from './versioning.service';
import { JwtAuthGuard, CurrentUser } from '../auth';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

/**
 * Versioning Controller
 * API endpoints for content version management
 */
@ApiTags('Versioning')
@Controller('content/:contentId/versions')
export class VersioningController {
  constructor(private readonly versioningService: VersioningService) {}

  /**
   * List all versions for a content
   */
  @Get()
  @ApiOperation({ summary: 'List all versions for a content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all versions with metadata',
  })
  listVersions(@Param('contentId') contentId: string) {
    return this.versioningService.getVersions(contentId);
  }

  /**
   * Get a specific version
   */
  @Get(':version')
  @ApiOperation({ summary: 'Get a specific version by version number' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiParam({ name: 'version', description: 'Version number' })
  @ApiResponse({
    status: 200,
    description: 'Returns the version details with snapshot',
  })
  @ApiResponse({
    status: 404,
    description: 'Version not found',
  })
  getVersion(
    @Param('contentId') contentId: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.versioningService.getVersion(contentId, version);
  }

  /**
   * Compare two versions
   */
  @Get('compare')
  @ApiOperation({ summary: 'Compare two versions of a content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiQuery({ name: 'versionA', description: 'First version number' })
  @ApiQuery({ name: 'versionB', description: 'Second version number' })
  @ApiResponse({
    status: 200,
    description: 'Returns differences between two versions',
  })
  compareVersions(
    @Param('contentId') contentId: string,
    @Query('versionA', ParseIntPipe) versionA: number,
    @Query('versionB', ParseIntPipe) versionB: number,
  ) {
    return this.versioningService.compareVersions(contentId, versionA, versionB);
  }

  /**
   * Restore content from a specific version
   */
  @Post(':versionId/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore content from a specific version' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiParam({ name: 'versionId', description: 'Version ID to restore from' })
  @ApiResponse({
    status: 200,
    description: 'Content restored from version successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Content or version not found',
  })
  restoreVersion(
    @Param('contentId') contentId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.versioningService.restoreFromVersion(
      contentId,
      versionId,
      user?.userId,
    );
  }
}

