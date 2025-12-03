import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { AssignRoleDto } from './dtos/assign-role.dto';
import { TogglePermissionDto } from './dtos/toggle-permission.dto';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import {
  CheckAccessResponseDto,
  AssignRoleResponseDto,
  AddPermissionResponseDto,
} from './dtos/rbac-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermissions } from './decorators/require-permissions.decorator';
// [LƯU Ý]: Sửa đường dẫn này theo đúng project của bạn
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('RBAC Management')
@ApiBearerAuth() // Hiện ổ khóa trên Swagger
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ==================================================================
  // SECTION 1: ROLE VIEW
  // ==================================================================

  @Get('roles')
  @ApiOperation({
    summary: 'List all roles',
    description:
      'Retrieve a list of all system roles (e.g., ADMIN, INSTRUCTOR) along with their currently assigned permissions.',
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('READ', 'ROLE')
  async listRoles() {
    return this.rbacService.listRoles();
  }

  // ==================================================================
  // SECTION 2: PERMISSION MANAGEMENT
  // ==================================================================

  @Post('permissions')
  @ApiOperation({
    summary: 'Create a new Permission definition',
    description:
      'Define a new Permission in the system (Action + Subject). E.g., CREATE_VIDEO, DELETE_COMMENT.',
  })
  @ApiResponse({ status: 201, description: 'Permission created successfully.' })
  @ApiResponse({ status: 409, description: 'Permission already exists.' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CREATE', 'PERMISSION')
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.rbacService.createPermission(dto);
  }

  @Get('permissions')
  @ApiOperation({
    summary: 'List all available permissions',
    description: 'Get a flat list of all permissions defined in the database.',
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('READ', 'PERMISSION')
  async listPermissions() {
    return this.rbacService.listPermissions();
  }

  @Delete('permissions/:id')
  @ApiOperation({
    summary: 'Delete a permission by ID',
    description:
      'Permanently remove a permission definition from the system. This will revoke it from all roles.',
  })
  @ApiParam({ name: 'id', description: 'The UUID of the permission to delete' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('DELETE', 'PERMISSION')
  async deletePermission(@Param('id') id: string) {
    return this.rbacService.deletePermission(id);
  }

  // ==================================================================
  // SECTION 3: ASSIGNMENT (User-Role & Role-Permission)
  // ==================================================================

  @Post('assign-role')
  @ApiOperation({
    summary: 'Assign a role to a user',
    description:
      'Grant a specific role (e.g., INSTRUCTOR) to a user. A user can have multiple roles.',
  })
  @ApiResponse({ status: 201, type: AssignRoleResponseDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('GRANT', 'ROLE')
  async assignRole(@Body() dto: AssignRoleDto) {
    return this.rbacService.assignRoleToUser(dto);
  }

  @Post('revoke-role')
  @ApiOperation({
    summary: 'Revoke a role from a user',
    description:
      'Remove a specific role from a user. The user will lose all permissions associated with that role.',
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('REVOKE', 'ROLE')
  async revokeRole(@Body() dto: AssignRoleDto) {
    return this.rbacService.revokeRoleFromUser(dto.userId, dto.roleName);
  }

  @Post('permissions/add-to-role')
  @ApiOperation({
    summary: 'Grant a permission to a role',
    description:
      'Dynamically attach a permission to a specific role. All users with this role will immediately inherit this permission.',
  })
  @ApiResponse({ status: 201, type: AddPermissionResponseDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE', 'ROLE')
  async addPermissionToRole(@Body() dto: TogglePermissionDto) {
    return this.rbacService.addPermissionToRole(dto);
  }

  @Post('permissions/remove-from-role')
  @ApiOperation({
    summary: 'Revoke a permission from a role',
    description:
      'Detach a permission from a specific role. Users with this role will no longer have this permission.',
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('UPDATE', 'ROLE')
  async removePermissionFromRole(@Body() dto: TogglePermissionDto) {
    return this.rbacService.revokePermissionFromRole(
      dto.roleName,
      dto.action,
      dto.subject,
    );
  }

  // ==================================================================
  // SECTION 4: ACCESS CHECK
  // ==================================================================

  @Get('check-access')
  @ApiOperation({
    summary: 'Verify user access',
    description:
      'Check if a specific user has sufficient permissions to perform an action on a subject. Returns boolean.',
  })
  @ApiQuery({ name: 'userId', description: 'UUID of the user to check' })
  @ApiQuery({ name: 'action', description: 'Action to verify (e.g., CREATE)' })
  @ApiQuery({ name: 'subject', description: 'Target resource (e.g., CONTENT)' })
  @ApiResponse({ status: 200, type: CheckAccessResponseDto })
  async checkAccess(
    @Query('userId') userId: string,
    @Query('action') action: string,
    @Query('subject') subject: string,
  ) {
    const hasAccess = await this.rbacService.checkAccess(
      userId,
      action,
      subject,
    );
    return { hasAccess };
  }
}
