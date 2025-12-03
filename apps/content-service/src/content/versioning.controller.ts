import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';

@ApiTags('Content Versioning')
@Controller('contentVersion')
export class VersioningController {
  constructor(private readonly service: ContentService) {}

  @Get(':id/versions')
  @ApiOperation({ summary: 'List all versions for a content' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all versions with metadata',
  })
  listVersions(@Param('id') id: string) {
    return this.service.listVersions(id);
  }

  @Post(':id/versions/:versionId/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore content from a specific version' })
  @ApiResponse({
    status: 200,
    description: 'Content restored from version successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Content or version not found',
  })
  restoreVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.service.restoreVersion(id, versionId);
  }

  @Get(':id/versions/compare')
  @ApiOperation({ summary: 'Compare two versions of a content' })
  @ApiResponse({
    status: 200,
    description: 'Returns differences between two versions',
  })
  compareVersions(
    @Param('id') id: string,
    @Query('versionA') versionA: string,
    @Query('versionB') versionB: string,
  ) {
    return this.service.compareVersions(
      id,
      parseInt(versionA, 10),
      parseInt(versionB, 10),
    );
  }
}
