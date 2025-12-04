import { IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttachTagsDto {
  @ApiProperty({
    description: 'Array of tag names to attach',
    example: ['math', 'algebra', 'grade10'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tags: string[];
}

