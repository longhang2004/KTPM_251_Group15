import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateFileDto {
  @ApiPropertyOptional({
    description: 'Update file name',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Update file type/MIME type',
  })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({
    description: 'Update file checksum',
  })
  @IsOptional()
  @IsString()
  checksum?: string;

  @ApiPropertyOptional({
    description: 'Update associated content ID',
  })
  @IsOptional()
  @IsUUID()
  contentId?: string;

  @ApiPropertyOptional({
    description: 'Update file metadata',
    example: { tags: ['document', 'important'], category: 'lesson' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
