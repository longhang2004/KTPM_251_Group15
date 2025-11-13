import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed database...');

  // 1. Tạo Roles
  console.log('📝 Tạo Roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
      description: 'Quản trị viên hệ thống - Toàn quyền truy cập',
    },
  });

  const instructorRole = await prisma.role.upsert({
    where: { name: RoleName.INSTRUCTOR },
    update: {},
    create: {
      name: RoleName.INSTRUCTOR,
      description: 'Giảng viên - Quản lý nội dung và học sinh',
    },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: RoleName.STUDENT },
    update: {},
    create: {
      name: RoleName.STUDENT,
      description: 'Học sinh - Xem và học nội dung',
    },
  });

  console.log('✅ Roles đã được tạo:', {
    admin: adminRole.id,
    instructor: instructorRole.id,
    student: studentRole.id,
  });

  // 2. Tạo Permissions
  console.log('🔐 Tạo Permissions...');
  const permissions = [
    // Content Permissions
    { action: 'CREATE', subject: 'CONTENT' },
    { action: 'READ', subject: 'CONTENT' },
    { action: 'UPDATE', subject: 'CONTENT' },
    { action: 'DELETE', subject: 'CONTENT' },
    // User Permissions
    { action: 'CREATE', subject: 'USER' },
    { action: 'READ', subject: 'USER' },
    { action: 'UPDATE', subject: 'USER' },
    { action: 'DELETE', subject: 'USER' },
    // Override Permissions
    { action: 'OVERRIDE', subject: 'PATHWAY' },
    { action: 'INTERVENE', subject: 'FEEDBACK' },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: {
        action_subject: {
          action: perm.action,
          subject: perm.subject,
        },
      },
      update: {},
      create: {
        action: perm.action,
        subject: perm.subject,
        description: `${perm.action} permission for ${perm.subject}`,
      },
    });
    createdPermissions.push(permission);
  }

  console.log(`✅ Đã tạo ${createdPermissions.length} permissions`);

  // 3. Gán Permissions cho Roles
  console.log('🔗 Gán Permissions cho Roles...');

  // ADMIN: Tất cả permissions
  for (const perm of createdPermissions) {
    const permissionId = String(perm.id);
    await prisma.permissionsOnRoles.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId,
      },
    });
  }

  // INSTRUCTOR: Content + Override + Intervene
  const instructorPerms = createdPermissions.filter(
    (p: { subject: string; action: string }) =>
      p.subject === 'CONTENT' ||
      p.action === 'OVERRIDE' ||
      p.action === 'INTERVENE' ||
      (p.subject === 'USER' && p.action === 'READ'),
  );
  for (const perm of instructorPerms) {
    const permissionId = String(perm.id);
    await prisma.permissionsOnRoles.upsert({
      where: {
        roleId_permissionId: {
          roleId: instructorRole.id,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: instructorRole.id,
        permissionId,
      },
    });
  }

  // STUDENT: Chỉ READ CONTENT
  const studentPerms = createdPermissions.filter(
    (p: { subject: string; action: string }) =>
      p.subject === 'CONTENT' && p.action === 'READ',
  );
  for (const perm of studentPerms) {
    const permissionId = String(perm.id);
    await prisma.permissionsOnRoles.upsert({
      where: {
        roleId_permissionId: {
          roleId: studentRole.id,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: studentRole.id,
        permissionId,
      },
    });
  }

  console.log('✅ Đã gán permissions cho các roles');

  // 4. Tạo Admin User mặc định (nếu cần)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ktpm.edu.vn';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash(adminPassword, 10);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: 'System Administrator',
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });

    console.log('✅ Đã tạo Admin user:', adminUser.email);
    console.log('   Password mặc định:', adminPassword);
  } else {
    console.log('ℹ️  Admin user đã tồn tại:', adminEmail);
  }

  console.log('🎉 Seed database hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
