import { 
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  HttpCode, UsePipes, ValidationPipe, Req, UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { AttachTagsDto } from './dto/attach-tags.dto';

import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
//---PERMISSION
import { PermissionsGuard } from '../common/authorization/permissions.guard';
import { RequirePermissions } from '../common/authorization/permissions.decorator';
import { domainToUnicode } from 'url';

@ApiTags('Content Management')
@ApiBearerAuth('JWT-auth')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // --------------------------------------------------------
  // CREATE (ADMIN, INSTRUCTOR)
  // --------------------------------------------------------
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CREATE:CONTENT')
  @ApiOperation({ summary: 'Create new content' })
  @ApiResponse({ status: 201, description: 'Content created successfully.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() dto: CreateContentDto, @Req() req: { user: { userId: string } }) {
    return this.contentService.create(dto, req.user.userId);
  }

  // --------------------------------------------------------
  // LIST ALL (PUBLIC)
  // --------------------------------------------------------
  @Get()
  @ApiOperation({ summary: 'List content' })
  findAll(@Query() query: QueryContentDto) {
    return this.contentService.findAll({
      type: query.type,
      includeArchived: query.includeArchived === 'true',
      search: query.search,
    });
  }

  // --------------------------------------------------------
  // GET ONE (PUBLIC)
  // --------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  // --------------------------------------------------------
  // UPDATE (ADMIN, INSTRUCTOR)
  // --------------------------------------------------------
  @Patch(':id')
  @UseGuards(JwtAuthGuard,PermissionsGuard)
  @RequirePermissions('UPDATE:CONTENT')
  @ApiOperation({ summary: 'Update content by ID' })
  update(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    return this.contentService.update(id, dto);
  }

  // --------------------------------------------------------
  // ARCHIVE (ADMIN, INSTRUCTOR)
  // --------------------------------------------------------
  @Delete(':id')
  @UseGuards(JwtAuthGuard,PermissionsGuard)
  @RequirePermissions('DELETE:CONTENT')
  @ApiOperation({ summary: 'Archive content' })
  @HttpCode(204)
  async archive(@Param('id') id: string) {
    await this.contentService.archive(id);
  }

  // --------------------------------------------------------
  // RESTORE (ADMIN)
  // --------------------------------------------------------
  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('RESTORE:CONTENT')
  @ApiOperation({ summary: 'Restore archived content' })
  restore(@Param('id') id: string) {
    return this.contentService.restore(id);
  }

}
