import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'EXPORT', description: 'Hành động (Action)' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'REPORT', description: 'Tài nguyên (Resource)' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Cho phép xuất báo cáo', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
