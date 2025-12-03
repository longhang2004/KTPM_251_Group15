import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateContentDto, authorId: string) {
        try {
            const { metadata, ...contentData } = dto;

            return await this.prisma.content.create({
                data: {
                    ...contentData,
                    author: { connect: { id: authorId } },
                    ...(metadata ? { metadata: { create: { ...metadata } } } : {}),
                },
                include: { metadata: true },
            });
        } catch (err) {
            console.error('Create error:', err);
            throw new BadRequestException('Cannot create content');
        }
    }

    async findAll(query: { type?: string; includeArchived?: boolean; search?: string }) {
        try {
            const where: any = {};
            if (query.type) where.contentType = query.type;
            if (query.includeArchived === true) {
                where.isArchived = true;
            } else if (query.includeArchived === false) {
                where.isArchived = false;
            }
            if (query.search) where.title = { contains: query.search, mode: 'insensitive' };

                return await this.prisma.content.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    include: { metadata: true },
                });
            } catch (err) {
                console.error('FindAll error:', err);
                throw new BadRequestException('Cannot load content list');
            }
        }

    async findOne(id: string) {
            const content = await this.prisma.content.findUnique({
                where: { id },
                include: { metadata: true },
            });
            if (!content) throw new NotFoundException('Content not found');
            return content;
        }

    async update(id: string, dto: UpdateContentDto) {
            await this.findOne(id);
            const { metadata, ...contentData } = dto;

            return this.prisma.content.update({
                where: { id },
                data: {
                    ...contentData,
                    ...(metadata
                        ? {
                            metadata: {
                                upsert: {
                                    create: { ...metadata },
                                    update: { ...metadata },
                                },
                            },
                        }
                        : {}),
                },
                include: { metadata: true },
            });
        }

    async archive(id: string) {
            await this.findOne(id);
            return this.prisma.content.update({
                where: { id },
                data: { isArchived: true, archivedAt: new Date() },
            });
        }

    async restore(id: string) {
            await this.findOne(id);
            return this.prisma.content.update({
                where: { id },
                data: { isArchived: false, archivedAt: null },
            });
        }
    }
