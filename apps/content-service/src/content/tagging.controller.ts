import { 
  Controller, Get, Post, Body, Param, Delete, Query,
  HttpCode,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ContentService } from './content.service';
import { AttachTagsDto } from './dto/attach-tags.dto';

@ApiTags('Content Management')
@Controller('tag')
export class TaggingController {
  constructor(private readonly service: ContentService) {}

  @Get()
  list(@Query('tag') tag?: string) {
    return this.service.list(tag);
  }

  @Get(':id')
  getTag(@Param('id') id: string) {
    return this.service.getTag(id);
  }

  @Post(':id/tags')
  attachTags(@Param('id') id: string, @Param('tags') tags: string[]) {
    return this.service.attachTags(id, tags);
  }

  @Delete(':id/tags/:tagName')
  @HttpCode(204)
  detachTag(@Param('id') id: string, @Param('tagName') tagName: string) {
    return this.service.detachTag(id, tagName);
  }

}
