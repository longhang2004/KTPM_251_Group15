import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Roles
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

  console.log('✅ Roles created:', {
    admin: adminRole.id,
    instructor: instructorRole.id,
    student: studentRole.id,
  });

  // 2. Create Permissions
  console.log('🔐 Creating Permissions...');
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

  const createdPermissions: Array<{ id: string; action: string; subject: string }> = [];
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

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // 3. Assign Permissions to Roles
  console.log('🔗 Assigning Permissions to Roles...');

  // ADMIN: All permissions
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

  // STUDENT: Only READ CONTENT
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

  console.log('✅ Assigned permissions to roles');

  // 4. Create default Admin User (if needed)
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

    console.log('✅ Created Admin user:', adminUser.email);
    console.log('   Default password:', adminPassword);
  } else {
    console.log('ℹ️  Admin user already exists:', adminEmail);
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
