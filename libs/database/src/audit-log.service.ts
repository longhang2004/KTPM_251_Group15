import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ghi lại một hành động vào audit log
   * @param userId ID của user thực hiện hành động
   * @param action Hành động (ví dụ: 'UPDATE_CONTENT', 'OVERRIDE_PATHWAY')
   * @param subject Đối tượng bị tác động (ví dụ: 'CONTENT_ID_123')
   * @param details Chi tiết thay đổi (dạng JSON)
   */
  async log(
    userId: string,
    action: string,
    subject: string,
    details?: Prisma.JsonValue,
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        subject,
        details: details || null,
      },
    });
  }

  /**
   * Lấy audit logs theo user
   */
  async findByUserId(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * Lấy audit logs theo subject (đối tượng bị tác động)
   */
  async findBySubject(subject: string) {
    return this.prisma.auditLog.findMany({
      where: { subject },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }
}
