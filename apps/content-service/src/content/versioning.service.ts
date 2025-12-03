import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/database';


@Injectable()
export class VersioningService {
    constructor(private prisma: PrismaService) {}

    async createSnapshot(contentId: string, content: any, version: number, title: string, body?: string | null) {
        try {
            return this.prisma.contentVersion.create({ 
                data: { 
                    contentId, 
                    content, 
                    version,
                    title, 
                    body
                } 
            });
        } catch (err) {
            console.error('Create snapshot error:', err);
            throw new BadRequestException('Cannot create version snapshot');
        }
    }
}