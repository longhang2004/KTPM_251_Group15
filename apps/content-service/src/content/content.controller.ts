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
  UsePipes,
  ValidationPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import {
  ContentResponseDto,
  ContentListResponseDto,
  ErrorResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
} from './dto/content-response.dto';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
//---PERMISSION
import { PermissionsGuard } from '../common/authorization/permissions.guard';
import { RequirePermissions } from '../common/authorization/permissions.decorator';
import type { AuthenticatedRequest } from '../common/types/auth.types';

@ApiTags('Content Management')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // --------------------------------------------------------
  // CREATE (ADMIN, INSTRUCTOR) - FR-LCM-07
  // --------------------------------------------------------
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CREATE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new content',
    description:
      'Create new learning content. Requires CREATE:CONTENT permission (ADMIN, INSTRUCTOR).',
  })
  @ApiResponse({
    status: 201,
    description: 'Content created successfully.',
    type: ContentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error.',
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() dto: CreateContentDto, @Req() req: AuthenticatedRequest) {
    return this.contentService.create(dto, req.user.userId);
  }

  // --------------------------------------------------------
  // LIST ALL (Advanced Search & Filter) - FR-LCM-06
  // Public endpoint but respects archived filter
  // --------------------------------------------------------
  @Get()
  @ApiOperation({
    summary: 'Search and filter content',
    description:
      'Advanced search and filter with pagination. Supports: search, type, status, author, tags, hierarchy, metadata, sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Content list with pagination.',
    type: ContentListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query parameters.',
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  findAll(@Query() query: QueryContentDto) {
    return this.contentService.findAll(query);
  }

  // --------------------------------------------------------
  // GET ONE (Public but respects archived status) - FR-LCM-07
  // --------------------------------------------------------
  @Get(':id')
  @ApiOperation({
    summary: 'Get content by ID',
    description:
      'Get detailed content information. Public access but archived content may be restricted.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Content details with author, tags, metadata, hierarchy, and version history.',
    type: ContentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Content not found.',
    type: NotFoundResponseDto,
  })
  async findOne(@Param('id') id: string, @Req() req?: AuthenticatedRequest) {
    // Optional: Check access if user is authenticated
    if (req?.user) {
      const canAccess = await this.contentService.canUserAccessContent(
        id,
        req.user.userId,
        req.user.roles || [],
      );
      if (!canAccess) {
        // Still return content but could filter sensitive data
        // For now, we'll return it anyway as it's a public endpoint
      }
    }
    return this.contentService.findOne(id);
  }

  // --------------------------------------------------------
  // UPDATE (Ownership + Permission Check) - FR-LCM-07
  // Only author, ADMIN, or INSTRUCTOR can update
  // --------------------------------------------------------
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update content by ID',
    description:
      'Update content. Only author, ADMIN, or INSTRUCTOR with UPDATE:CONTENT permission can update.',
  })
  @ApiResponse({
    status: 200,
    description: 'Content updated successfully.',
    type: ContentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to update this content.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Content not found.',
    type: NotFoundResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error.',
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.contentService.update(
      id,
      dto,
      req.user.userId,
      req.user.roles || [],
    );
  }

  // --------------------------------------------------------
  // ARCHIVE (Ownership + Permission Check) - FR-LCM-07
  // Only author, ADMIN, or INSTRUCTOR can archive
  // --------------------------------------------------------
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('DELETE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Archive content',
    description:
      'Archive content (soft delete). Only author, ADMIN, or INSTRUCTOR with DELETE:CONTENT permission can archive.',
  })
  @ApiResponse({
    status: 204,
    description: 'Content archived successfully. No content in response body.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not authorized to archive this content.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Content not found.',
    type: NotFoundResponseDto,
  })
  @HttpCode(204)
  async archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.contentService.archive(
      id,
      req.user.userId,
      req.user.roles || [],
    );
  }

  // --------------------------------------------------------
  // RESTORE (ADMIN, INSTRUCTOR only) - FR-LCM-07
  // --------------------------------------------------------
  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE:CONTENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Restore archived content',
    description:
      'Restore archived content. Only ADMIN or INSTRUCTOR can restore.',
  })
  @ApiResponse({
    status: 200,
    description: 'Content restored successfully.',
    type: ContentResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only ADMIN or INSTRUCTOR can restore.',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Content not found.',
    type: NotFoundResponseDto,
  })
  restore(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.contentService.restore(id, req.user.roles || []);
  }
}
