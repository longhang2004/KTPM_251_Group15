import { ApiProperty } from '@nestjs/swagger';

// 1. Mẫu trả về cho API Check Access
export class CheckAccessResponseDto {
  @ApiProperty({ 
    example: true, 
    description: 'Indicates if the user has permission' 
  })
  hasAccess: boolean;
}

// 2. Mẫu trả về cho API Assign Role
export class AssignRoleResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  userId: string;

  @ApiProperty({ example: 'b1fec99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  roleId: string;

  @ApiProperty({ example: '2025-11-25T09:00:00.000Z' })
  assignedAt: Date;
}

// 3. Mẫu trả về cho API Add Permission
export class AddPermissionResponseDto {
  @ApiProperty({ example: 'b1fec99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  roleId: string;

  @ApiProperty({ example: 'c2ged99-9c0b-4ef8-bb6d-6bb9bd380a33' })
  permissionId: string;

  @ApiProperty({ example: '2025-11-25T09:00:00.000Z' })
  assignedAt: Date;
}