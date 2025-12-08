import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { QueryArchivedContentDto } from './dto/query-archived-content.dto';
import { JwtAuthGuard, CurrentUser } from '../auth';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PermissionsGuard, RequirePermissions } from '../authorization';

/**
 * Content Controller
 * API endpoints for content management
 */
@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * Create new content
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CREATE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new content' })
  @ApiResponse({ status: 201, description: 'Content created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - missing permission' })
  create(
    @Body() createContentDto: CreateContentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contentService.create(createContentDto, user.userId);
  }

  /**
   * List all content
   */
  @Get()
  @ApiOperation({ summary: 'List all content with optional filters' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Returns content list' })
  @UsePipes(new ValidationPipe({ transform: true }))
  findAll(@Query() query: QueryContentDto) {
    return this.contentService.findAll(query);
  }

  /**
   * Get archived content list
   */
  @Get('archived')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('READ:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List archived content' })
  @ApiResponse({ status: 200, description: 'Returns archived content list' })
  getArchived(@Query() query: QueryArchivedContentDto) {
    return this.contentService.getArchived({ ...query });
  }

  /**
   * Get content by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Returns content' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  /**
   * Update content
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update content by ID' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Content updated successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  update(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.contentService.update(id, updateContentDto, user.userId);
  }

  /**
   * Archive content (soft delete)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('DELETE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive content (soft delete)' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Content archived successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contentService.archive(id, user.userId);
  }

  /**
   * Restore archived content
   */
  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore archived content' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Content restored successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  restore(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contentService.restore(id, user.userId);
  }

  /**
   * Permanently delete content
   */
  @Delete(':id/permanent')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('DELETE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete content (cannot be undone)' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  @ApiResponse({ status: 200, description: 'Content deleted permanently' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  delete(@Param('id') id: string) {
    return this.contentService.delete(id);
  }
}
