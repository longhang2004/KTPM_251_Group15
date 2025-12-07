import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TaggingService } from './tagging.service';
import { JwtAuthGuard } from '../auth';
import { PermissionsGuard, RequirePermissions } from '../authorization';
import { AttachTagsDto } from './dto/attach-tags.dto';

/**
 * Tagging Controller
 * API endpoints for tag management
 */
@ApiTags('Tags')
@Controller('tags')
export class TaggingController {
  constructor(private readonly taggingService: TaggingService) {}

  /**
   * List all tags
   */
  @Get()
  @ApiOperation({ summary: 'List all tags' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all tags with content count',
  })
  listTags() {
    return this.taggingService.getAllTags();
  }

  /**
   * Search tags by prefix
   */
  @Get('search')
  @ApiOperation({ summary: 'Search tags by name prefix' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiResponse({
    status: 200,
    description: 'Returns matching tags',
  })
  searchTags(@Query('q') query: string) {
    return this.taggingService.searchTags(query || '');
  }

  /**
   * Get tag by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID with associated content' })
  @ApiParam({ name: 'id', description: 'Tag ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns tag with its content',
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found',
  })
  getTagById(@Param('id') id: string) {
    return this.taggingService.getTagById(id);
  }

  /**
   * Get tag by name
   */
  @Get('name/:name')
  @ApiOperation({ summary: 'Get tag by name with associated content' })
  @ApiParam({ name: 'name', description: 'Tag name' })
  @ApiResponse({
    status: 200,
    description: 'Returns tag with its content',
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found',
  })
  getTagByName(@Param('name') name: string) {
    return this.taggingService.getTagByName(name);
  }
}

/**
 * Content Tags Controller
 * API endpoints for managing tags on specific content
 */
@ApiTags('Content Tags')
@Controller('content/:contentId/tags')
export class ContentTagsController {
  constructor(private readonly taggingService: TaggingService) {}

  /**
   * Get tags for a content
   */
  @Get()
  @ApiOperation({ summary: 'Get all tags for a content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of tags',
  })
  getContentTags(@Param('contentId') contentId: string) {
    return this.taggingService.getTagsForContent(contentId);
  }

  /**
   * Attach tags to content
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Attach tags to content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'Tags attached successfully',
  })
  attachTags(
    @Param('contentId') contentId: string,
    @Body() dto: AttachTagsDto,
  ) {
    return this.taggingService.attachToContent(contentId, dto.tags);
  }

  /**
   * Detach a tag from content
   */
  @Delete(':tagName')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detach a tag from content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiParam({ name: 'tagName', description: 'Tag name to remove' })
  @ApiResponse({
    status: 200,
    description: 'Tag removed successfully',
  })
  detachTag(
    @Param('contentId') contentId: string,
    @Param('tagName') tagName: string,
  ) {
    return this.taggingService.detachFromContent(contentId, tagName);
  }

  /**
   * Clear all tags from content
   */
  @Delete()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all tags from content' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'All tags removed',
  })
  clearTags(@Param('contentId') contentId: string) {
    return this.taggingService.clearTagsFromContent(contentId);
  }
}

