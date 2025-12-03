import { PartialType } from '@nestjs/swagger';
import { CreateContentDto, CreateMetadataDto } from './create-content.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Validate data when update content.
export class UpdateContentDto extends PartialType(CreateContentDto) {
  // Allow updating metadata
  @ApiPropertyOptional({
    type: CreateMetadataDto,
    description: 'Update metadata for the content',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMetadataDto)
  metadata?: CreateMetadataDto;
}
