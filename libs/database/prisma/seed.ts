import { PrismaClient, RoleName, Permission } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ====================================================================
  // 1. TẠO ROLES (VAI TRÒ)
  // ====================================================================
  console.log('📝 Creating Roles...');

  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
      description: 'System Administrator - Full access',
    },
  });

  const instructorRole = await prisma.role.upsert({
    where: { name: RoleName.INSTRUCTOR },
    update: {},
    create: {
      name: RoleName.INSTRUCTOR,
      description: 'Instructor - Manage content and students',
    },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: RoleName.STUDENT },
    update: {},
    create: {
      name: RoleName.STUDENT,
      description: 'Student - View and learn content',
    },
  });

  console.log('✅ Roles created/verified');

  // ====================================================================
  // 2. TẠO PERMISSIONS (QUYỀN HẠN)
  // ====================================================================
  console.log('🔐 Creating Permissions...');

  // Danh sách toàn bộ quyền trong hệ thống
  const permissionsData = [
    // --- QUẢN LÝ CONTENT (BÀI HỌC) ---
    { action: 'CREATE', subject: 'CONTENT' },
    { action: 'READ', subject: 'CONTENT' },
    { action: 'UPDATE', subject: 'CONTENT' },
    { action: 'DELETE', subject: 'CONTENT' },
    { action: 'PUBLISH', subject: 'CONTENT' },

    // --- QUẢN LÝ USER (NGƯỜI DÙNG) ---
    { action: 'CREATE', subject: 'USER' },
    { action: 'READ', subject: 'USER' },
    { action: 'UPDATE', subject: 'USER' },
    { action: 'DELETE', subject: 'USER' },

    // --- QUẢN LÝ ROLE (PHÂN QUYỀN - QUAN TRỌNG CHO ADMIN) ---
    { action: 'READ', subject: 'ROLE' }, // Xem danh sách role
    { action: 'GRANT', subject: 'ROLE' }, // Gán role cho user (assign-role)
    { action: 'REVOKE', subject: 'ROLE' }, // Thu hồi role (revoke-role)
    { action: 'UPDATE', subject: 'ROLE' }, // Gán/Gỡ permission cho role

    // --- QUẢN LÝ PERMISSION (ĐỊNH NGHĨA QUYỀN) ---
    { action: 'CREATE', subject: 'PERMISSION' },
    { action: 'READ', subject: 'PERMISSION' },
    { action: 'DELETE', subject: 'PERMISSION' },

    // --- CÁC QUYỀN KHÁC (THEO EERD/YÊU CẦU) ---
    { action: 'OVERRIDE', subject: 'PATHWAY' },
    { action: 'INTERVENE', subject: 'FEEDBACK' },
  ];

  const allPermissions: Permission[] = [];

  for (const p of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: {
        action_subject: { action: p.action, subject: p.subject },
      },
      update: {},
      create: {
        action: p.action,
        subject: p.subject,
        description: `${p.action} permission for ${p.subject}`,
      },
    });
    allPermissions.push(permission);
  }
  console.log(`✅ ${allPermissions.length} Permissions synced`);

  // ====================================================================
  // 3. GÁN QUYỀN CHO ROLES
  // ====================================================================
  console.log('🔗 Assigning Permissions to Roles...');

  // --- A. ADMIN: NHẬN TẤT CẢ QUYỀN (GOD MODE) ---
  // Duyệt qua danh sách allPermissions vừa tạo và gán hết cho Admin
  for (const perm of allPermissions) {
    const permissionId = String(perm.id);
    await prisma.permissionsOnRoles.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId },
    });
  }
  console.log('   👑 ADMIN Role now has ALL permissions');

  // --- B. INSTRUCTOR: CONTENT + USER VIEW + FEEDBACK ---
  const instructorPerms = allPermissions.filter(
    (p) =>
      p.subject === 'CONTENT' ||
      p.action === 'INTERVENE' ||
      (p.subject === 'USER' && p.action === 'READ'),
  );

  for (const perm of instructorPerms) {
    const permissionId = String(perm.id);
    await prisma.permissionsOnRoles.upsert({
      where: {
        roleId_permissionId: { roleId: instructorRole.id, permissionId },
      },
      update: {},
      create: { roleId: instructorRole.id, permissionId },
    });
  }

  // --- C. STUDENT: CHỈ ĐỌC CONTENT ---
  const studentPerms = allPermissions.filter(
    (p) => p.subject === 'CONTENT' && p.action === 'READ',
  );

  for (const perm of studentPerms) {
    const permissionId = String(perm.id);
    await prisma.permissionsOnRoles.upsert({
      where: {
        roleId_permissionId: { roleId: studentRole.id, permissionId },
      },
      update: {},
      create: { roleId: studentRole.id, permissionId },
    });
  }

  // ====================================================================
  // 4. TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH
  // ====================================================================
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ktpm.edu.vn';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // Kiểm tra xem user có tồn tại không
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { roles: true }, // Lấy kèm roles để check
  });

  if (!existingAdmin) {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Super Administrator',
        roles: {
          create: [
            { roleId: adminRole.id }, // Gán Role ADMIN (Role này đã chứa full quyền)
          ],
        },
      },
    });
    console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    // Nếu user đã tồn tại, kiểm tra xem đã có role ADMIN chưa, nếu chưa thì gán thêm
    const hasAdminRole = existingAdmin.roles.some(
      (r) => r.roleId === adminRole.id,
    );

    if (!hasAdminRole) {
      await prisma.rolesOnUsers.create({
        data: {
          userId: existingAdmin.id,
          roleId: adminRole.id,
        },
      });
      console.log('✅ Updated existing Admin user with ADMIN role');
    } else {
      console.log('ℹ️  Admin user already exists and has correct roles');
    }
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
