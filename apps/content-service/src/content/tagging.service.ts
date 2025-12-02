import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/database';


@Injectable()
export class TaggingService {
    constructor(private prisma: PrismaService) {}

    async attachToContent(contentId: string, tags: string[]) {
        const attached: string[] = [];
        for (const name of tags) {
            const tag = await this
                .prisma.tag.upsert({ 
                    where: { 
                        name
                    }, 
                    update: {}, 
                    create: { name } 
                });
            try {
                await this.prisma.tagsOnContents.create({ 
                    data: { 
                        contentId, 
                        tagId: tag.id 
                    } 
                });
                attached.push(name);
            } catch (err) {
                console.error('Attach tag:', err);
                throw new BadRequestException('Cannot attach tag');
            }   
        }
        return { attached };
    }


    async detachFromContent(contentId: string, name: string) {
        const tag = await this
            .prisma.tag.findUnique({ 
                where: { 
                    name
                } 
            });
        if (!tag) return { removed: 0 };
        const res = await this
            .prisma.tagsOnContents.deleteMany({ 
                where: { 
                    contentId, 
                    tag
                } 
            });
        return { removed: res.count };
    }
}