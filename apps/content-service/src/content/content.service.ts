import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { VersioningService } from './versioning.service';
import { TaggingService } from './tagging.service';
import { NONAME } from 'dns';
import { verify } from 'crypto';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private versioning: VersioningService,
    private tagging: TaggingService,
  ) {}

  async create(dto: CreateContentDto, authorId: string) {
    try {
      const con = await this.prisma.content.create({
        data: {
          title: dto.title,
          body: dto.body ?? null,
          contentType: dto.contentType,
          resourceUrl: dto.resourceUrl ?? null,
          author: {
            connect: { id: authorId },
          },
        },
      });

      await this.versioning.createSnapshot(
        con.id, // contentId
        con, // content
        1, // version
        dto.title, // title
        dto.body, // body
      );

      return con;
    } catch (err) {
      console.error('Create error:', err);
      throw new BadRequestException('Cannot create content');
    }
  }

  async findAll(query: {
    type?: string;
    includeArchived?: boolean;
    search?: string;
  }) {
    try {
      const where: any = {};

      if (query.type) where.contentType = query.type;
      if (!query.includeArchived) where.isArchived = false;
      if (query.search)
        where.title = { contains: query.search, mode: 'insensitive' };

      return await this.prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('FindAll error:', err);
      throw new BadRequestException('Cannot load content list');
    }
  }

  async findOne(id: string) {
    const content = await this.prisma.content.findUnique({ where: { id } });
    if (!content) throw new NotFoundException('Content not found');
    return content;
  }

  async update(id: string, dto: UpdateContentDto) {
    await this.findOne(id);
    return this.prisma.content.update({ where: { id }, data: { ...dto } });
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

  async list(tag?: string) {
    if (!tag) {
      const cons = await this.prisma.content.findMany({
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
      return cons.map((d) => ({
        ...d,
        tags: d.tags.map((dt) => dt.tag.name),
      }));
    }

    const tagObj = await this.prisma.tag.findUnique({ where: { name: tag } });

    if (!tagObj) return [];

    const conTags = await this.prisma.tagsOnContents.findMany({
      where: { tagId: tagObj.id },
      include: { content: true },
    });

    return conTags.map((dt) => dt.content);
  }

  async getTag(id: string) {
    const con = await this.prisma.content.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: { tag: true },
        },
      },
    });
    if (!con) throw new NotFoundException('Content not found');
    return { ...con, tags: con.tags.map((dt) => dt.tag.name) };
  }

  async listVersions(id: string) {
    return this.prisma.contentVersion.findMany({
      where: { contentId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async restoreVersion(dto: CreateContentDto, id: string, versionId: string) {
    const con = await this.prisma.content.findUnique({ where: { id } });
    const ver = await this.prisma.contentVersion.findUnique({
      where: { id: versionId },
    });

    if (!con || !ver || ver.contentId !== id)
      throw new NotFoundException('Content or Version not found');

    // snapshot current
    await this.versioning.createSnapshot(
      id, // contentId
      con, // content
      ver.version, // version
      con.title, // title
      dto.body, // body
    );

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        id: ver.contentId,
        title: ver.title,
      },
    });
    return updated;
  }

  async attachTags(id: string, tags: string[]) {
    const con = await this.prisma.content.findUnique({ where: { id } });
    if (!con) throw new NotFoundException('Document not found');
    return this.tagging.attachToContent(id, tags);
  }

  async detachTag(id: string, tagName: string) {
    return this.tagging.detachFromContent(id, tagName);
  }
}
