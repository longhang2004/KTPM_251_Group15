import { Controller, Post, Body, Get, Query, Delete, Param } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { AssignRoleDto } from './dtos/assign-role.dto';
import { TogglePermissionDto } from './dtos/toggle-permission.dto';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { 
  CheckAccessResponseDto, 
  AssignRoleResponseDto, 
  AddPermissionResponseDto 
} from './dtos/rbac-response.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery, 
  ApiParam 
} from '@nestjs/swagger';

@ApiTags('RBAC Management')
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ==================================================================
  // SECTION 1: ROLE VIEW (Xem danh sách Role)
  // ==================================================================

  @Get('roles')
  @ApiOperation({ 
    summary: 'List all roles', 
    description: 'Get list of fixed roles (ADMIN, INSTRUCTOR, STUDENT) and their current permissions.' 
  })
  async listRoles() {
    return this.rbacService.listRoles();
  }

  // ==================================================================
  // SECTION 2: PERMISSION MANAGEMENT (Quản lý Permission)
  // ==================================================================

  @Post('permissions')
  @ApiOperation({ summary: 'Create a new Permission definition' })
  @ApiResponse({ status: 201, description: 'Permission created.' })
  @ApiResponse({ status: 409, description: 'Permission already exists.' })
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.rbacService.createPermission(dto);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all available permissions' })
  async listPermissions() {
    return this.rbacService.listPermissions();
  }

  @Delete('permissions/:id')
  @ApiOperation({ summary: 'Delete a permission by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the permission' })
  async deletePermission(@Param('id') id: string) {
    return this.rbacService.deletePermission(id);
  }

  // ==================================================================
  // SECTION 3: ASSIGNMENT (Phân quyền & Gán vai trò)
  // ==================================================================

  @Post('assign-role')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: 201, type: AssignRoleResponseDto })
  async assignRole(@Body() dto: AssignRoleDto) {
    return this.rbacService.assignRoleToUser(dto);
  }

  @Post('revoke-role')
  @ApiOperation({ summary: 'Revoke a role from a user' })
  async revokeRole(@Body() dto: AssignRoleDto) {
    return this.rbacService.revokeRoleFromUser(dto.userId, dto.roleName);
  }

  @Post('permissions/add-to-role')
  @ApiOperation({ summary: 'Grant a permission to a role' })
  @ApiResponse({ status: 201, type: AddPermissionResponseDto })
  async addPermissionToRole(@Body() dto: TogglePermissionDto) {
    return this.rbacService.addPermissionToRole(dto);
  }

  @Post('permissions/remove-from-role')
  @ApiOperation({ summary: 'Revoke a permission from a role' })
  async removePermissionFromRole(@Body() dto: TogglePermissionDto) {
    return this.rbacService.revokePermissionFromRole(dto.roleName, dto.action, dto.subject);
  }

  // ==================================================================
  // SECTION 4: ACCESS CHECK (Bảo mật)
  // ==================================================================

  @Get('check-access')
  @ApiOperation({ summary: 'Verify user access' })
  @ApiQuery({ name: 'userId' })
  @ApiQuery({ name: 'action' })
  @ApiQuery({ name: 'subject' })
  @ApiResponse({ status: 200, type: CheckAccessResponseDto })
  async checkAccess(
    @Query('userId') userId: string,
    @Query('action') action: string,
    @Query('subject') subject: string,
  ) {
    const hasAccess = await this.rbacService.checkAccess(userId, action, subject);
    return { hasAccess };
  }
}