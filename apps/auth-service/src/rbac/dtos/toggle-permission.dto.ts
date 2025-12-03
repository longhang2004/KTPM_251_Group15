import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

export class TogglePermissionDto {
  @ApiProperty({
    enum: RoleName,
    description: 'The target role to grant/revoke permission',
    example: RoleName.INSTRUCTOR,
  })
  @IsEnum(RoleName)
  @IsNotEmpty()
  roleName: RoleName;

  @ApiProperty({
    description: 'The system action (e.g., CREATE, DELETE)',
    example: 'DELETE',
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({
    description: 'The target resource or subject (e.g., USER, CONTENT)',
    example: 'USER',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;
}