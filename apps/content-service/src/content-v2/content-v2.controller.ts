import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContentV2Service } from './content-v2.service';
import {
  CreateContentV2Dto,
  UpdateContentV2Dto,
  ContentV2ResponseDto,
  ContentV2ListResponseDto,
  QueryContentV2Dto,
} from './dto';
import { ResponseDto } from '../common/dto/reponse.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type CurrentUserData,
} from '../common/decorators/current-user.decorator';
// import { Public } from '../common/decorators/public.decorator';
// import { PermissionsGuard } from '../common/authorization/permissions.guard';
import { RequirePermissions } from '../common/authorization/permissions.decorator';

@ApiTags('Content v2')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('content-v2')
export class ContentV2Controller {
  constructor(private readonly contentV2Service: ContentV2Service) {}

  @RequirePermissions('CREATE:CONTENT')
  @Post()
  @ApiOperation({
    summary: 'Create new content with file attachments',
    description:
      'Create a new content item with optional file attachments, tags, and hierarchical structure',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Content created successfully',
    type: ResponseDto<ContentV2ResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or file references',
  })
  @ApiBody({ type: CreateContentV2Dto })
  async createContent(
    @Body() createContentDto: CreateContentV2Dto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ResponseDto<ContentV2ResponseDto>> {
    createContentDto.createdBy = user.id;
    return this.contentV2Service.createContent(createContentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get content list with advanced filtering',
    description:
      'Retrieve paginated list of content with filtering by type, status, tags, creator, and search terms',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content list retrieved successfully',
    type: ResponseDto<ContentV2ListResponseDto>,
  })
  @ApiQuery({ type: QueryContentV2Dto })
  async getContentList(
    @Query() queryDto: QueryContentV2Dto,
  ): Promise<ResponseDto<ContentV2ListResponseDto>> {
    return this.contentV2Service.getContentList(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get content by ID',
    description:
      'Retrieve detailed content information with all associated data',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content retrieved successfully',
    type: ResponseDto<ContentV2ResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content not found',
  })
  async getContentById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDto<ContentV2ResponseDto>> {
    return this.contentV2Service.getContentById(id);
  }

  @RequirePermissions('UPDATE:CONTENT')
  @Patch(':id')
  @ApiOperation({
    summary: 'Update content',
    description: 'Update content information, file attachments, and metadata',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content updated successfully',
    type: ResponseDto<ContentV2ResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or file references',
  })
  @ApiBody({ type: UpdateContentV2Dto })
  async updateContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContentDto: UpdateContentV2Dto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ResponseDto<ContentV2ResponseDto>> {
    updateContentDto.updatedBy = user.id;
    return this.contentV2Service.updateContent(id, updateContentDto);
  }

  @RequirePermissions('DELETE:CONTENT')
  @Delete(':id/archive')
  @ApiOperation({
    summary: 'Archive content',
    description: 'Soft delete content by changing status to ARCHIVED',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content archived successfully',
    type: ResponseDto<null>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Content is already archived',
  })
  async archiveContent(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDto<null>> {
    return this.contentV2Service.archiveContent(id);
  }

  /**
   * API 6: Restore archived content
   */
  @RequirePermissions('RESTORE:CONTENT')
  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restore archived content',
    description: 'Restore archived content back to DRAFT status',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Content restored successfully',
    type: ResponseDto<ContentV2ResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Content not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Content is not archived',
  })
  async restoreContent(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseDto<ContentV2ResponseDto>> {
    return this.contentV2Service.restoreContent(id);
  }

  // Additional utility endpoints

  /**
   * Get archived content list
   */
  @Get('archived/list')
  @ApiOperation({
    summary: 'Get archived content list',
    description: 'Retrieve list of archived content items',
  })
  @ApiQuery({ type: QueryContentV2Dto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Archived content list retrieved successfully',
    type: ResponseDto<ContentV2ListResponseDto>,
  })
  async getArchivedContent(
    @Query() queryDto: QueryContentV2Dto,
  ): Promise<ResponseDto<ContentV2ListResponseDto>> {
    // Force include archived and set status filter
    const archivedQuery = {
      ...queryDto,
      includeArchived: true,
      status: 'ARCHIVED' as any,
    };
    return this.contentV2Service.getContentList(archivedQuery);
  }
}
