import { 
  Controller, Get, Post, Body, Param
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';

@ApiTags('Content Management')
@Controller('contentVersion')
export class VersioningController {
  constructor(private readonly service: ContentService) {}

  @Get(':id/versions')
  listVersions(@Param('id') id: string) {
    return this.service.listVersions(id);
  }

  @Post(':id/versions/:versionId/restore')
  restoreVersion(@Body() dto: CreateContentDto, @Param('id') id: string, @Param('versionId') versionId: string) {
    return this.service.restoreVersion(dto, id, versionId);
  }

}
