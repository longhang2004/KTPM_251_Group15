import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

export class AssignRoleDto {
  @ApiProperty({
    description: 'The UUID of the user to assign the role to',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    enum: RoleName,
    description: 'The role name to assign (Select from enum)',
    example: RoleName.INSTRUCTOR,
  })
  @IsEnum(RoleName)
  @IsNotEmpty()
  roleName: RoleName;
}
