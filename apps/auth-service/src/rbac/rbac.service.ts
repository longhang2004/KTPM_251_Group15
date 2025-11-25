import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@app/database/prisma.service';
import { RoleName } from '@prisma/client';
import { AssignRoleDto } from './dtos/assign-role.dto';
import { TogglePermissionDto } from './dtos/toggle-permission.dto';
import { CreatePermissionDto } from './dtos/create-permission.dto';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================================================================
  // GROUP 1: ROLE VIEW (Chỉ xem, không tạo/xóa vì Role là Enum cố định)
  // ==================================================================

  /**
   * Lấy danh sách Role và các quyền đi kèm.
   * Rất quan trọng để hiển thị lên giao diện Admin.
   */
  async listRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  // ==================================================================
  // GROUP 2: PERMISSION MANAGEMENT (Quản lý các Permission gốc)
  // ==================================================================

  async createPermission(dto: CreatePermissionDto) {
    // Check trùng lặp: Một cặp Action-Resource chỉ được tồn tại 1 lần
    const exists = await this.prisma.permission.findUnique({
      where: {
        action_subject: { action: dto.action, subject: dto.subject }, // Lưu ý: Schema dùng 'subject' hay 'resource' thì sửa ở đây. Theo seed của bạn là 'subject'
      },
    });
    if (exists) throw new ConflictException('Permission already exists');

    return this.prisma.permission.create({
      data: {
        action: dto.action,
        subject: dto.subject, // Khớp với schema
        description: dto.description,
      },
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany();
  }

  async deletePermission(id: string) {
    try {
      return await this.prisma.permission.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException('Permission not found');
    }
  }

  // ==================================================================
  // GROUP 3: ASSIGNMENT (Gán ghép User <-> Role <-> Permission)
  // ==================================================================

  async assignRoleToUser(dto: AssignRoleDto) {
    const { userId, roleName } = dto;
    
    // Validate User & Role exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    // RoleName là Enum nên tìm theo name
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundException(`Role ${roleName} not found in DB`);

    return this.prisma.rolesOnUsers.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });
  }

  async revokeRoleFromUser(userId: string, roleName: RoleName) {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.rolesOnUsers.deleteMany({
      where: { userId, roleId: role.id },
    });
  }

  async addPermissionToRole(dto: TogglePermissionDto) {
    const role = await this.prisma.role.findUnique({ where: { name: dto.roleName } });
    if (!role) throw new NotFoundException('Role not found');

    const permission = await this.prisma.permission.findUnique({
      where: { action_subject: { action: dto.action, subject: dto.subject } },
    });
    if (!permission) throw new NotFoundException(`Permission ${dto.action}-${dto.subject} not found. Please create permission first.`);

    return this.prisma.permissionsOnRoles.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }

  async revokePermissionFromRole(roleName: RoleName, action: string, subject: string) {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundException('Role not found');

    const permission = await this.prisma.permission.findUnique({
      where: { action_subject: { action, subject } },
    });
    if (!permission) throw new NotFoundException('Permission not found');

    return this.prisma.permissionsOnRoles.deleteMany({
      where: { roleId: role.id, permissionId: permission.id },
    });
  }

  // ==================================================================
  // GROUP 4: ACCESS CONTROL (Security Core)
  // ==================================================================

  async checkAccess(userId: string, action: string, subject: string): Promise<boolean> {
    // 1. Lấy tất cả Role của User
    const userRoles = await this.prisma.rolesOnUsers.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    // 2. Gộp tất cả Permission lại thành 1 mảng
    const permissions = userRoles.flatMap((ur) => 
      ur.role.permissions.map((rp) => rp.permission)
    );

    // 3. Kiểm tra xem có quyền nào khớp không
    return permissions.some(
      (p) => p.action === action && p.subject === subject
    );
  }
}