import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an action to audit log
   * @param userId ID of user performing the action
   * @param action Action (e.g., 'UPDATE_CONTENT', 'OVERRIDE_PATHWAY')
   * @param subject Subject being affected (e.g., 'CONTENT_ID_123')
   * @param details Change details (JSON format)
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
        details: details || undefined,
      },
    });
  }

  /**
   * Get audit logs by user
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
   * Get audit logs by subject (affected object)
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
