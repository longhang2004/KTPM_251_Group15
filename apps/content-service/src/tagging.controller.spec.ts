import { Test, TestingModule } from '@nestjs/testing';
import { TaggingController } from './content/tagging.controller';
import { PrismaService } from '@app/database';
import { prismaMock } from '../test/mockup/prisma.mock';

describe('TaggingController', () => {
    let taggingController: TaggingController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [
                TaggingController,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        taggingController = app.get<TaggingController>(TaggingController);

        jest.clearAllMocks();
    });

    // ------------------------------------------------------
    // LIST()
    // ------------------------------------------------------
    describe('list()', () => {
        it('should list all content with their tag names', async () => {
            prismaMock.content.findMany.mockResolvedValue([
                {
                id: "1",
                title: 'Post 1',
                tags: [
                    { tag: { name: 'a' } },
                    { tag: { name: 'b' } },
                ],
                },
            ]);

            const result = await taggingController.list();

            expect(result).toEqual([
                {
                    id: "1",
                    title: 'Post 1',
                    tags: ['a', 'b'],
                },
            ]);
        });

        it('should return empty array when tag does not exist', async () => {
            prismaMock.tag.findUnique.mockResolvedValue(null);
            const result = await taggingController.list('nonexistent');
            expect(result).toEqual([]);
        });

        it('should list only content belonging to a specific tag', async () => {
            prismaMock.tag.findUnique.mockResolvedValue({ id: "10", name: 'a' });

            prismaMock.tagsOnContents.findMany.mockResolvedValue([
                { 
                    content: { 
                        id: "1", 
                        title: 'title_a' 
                    } 
                },
                { 
                    content: { 
                        id: "2", 
                        title: 'title_b' 
                    } 
                },
            ]);

            const result = await taggingController.list('a');

            expect(result).toEqual([
                { 
                    id: "1", 
                    title: 'title_a' 
                },
                { 
                    id: "2",
                    title: 'title_b' 
                },
            ]);
        });
    });

    // ------------------------------------------------------
    // ATTACH TAGS
    // ------------------------------------------------------
    describe('attachTags()', () => {
        it('should attach multiple tags to content', async () => {
            prismaMock.tag.findUnique.mockImplementation(({ where }) => {
                if (where.name === 'title_a')   return Promise.resolve({ id: "1" });
                if (where.name === 'title_b')   return Promise.resolve({ id: "2" });
                return Promise.resolve(null);
            });

            prismaMock.tagsOnContents.create.mockResolvedValue({});

            await taggingController.attachTags("99", ['title_a', 'title_b']);

            expect(prismaMock.tagsOnContents.create).toHaveBeenCalledTimes(2);

            expect(prismaMock.tagsOnContents.create).toHaveBeenCalledWith({
                data: { contentId: "99", tagId: "1" },
            });

            expect(prismaMock.tagsOnContents.create).toHaveBeenCalledWith({
                data: { contentId: "99", tagId: "2" },
            });
        });

        it('should skip attaching tags that do not exist', async () => {
            prismaMock.tag.findUnique.mockResolvedValue(null);

            await taggingController.attachTags("88", ['unknown']);

            expect(prismaMock.tagsOnContents.create).not.toHaveBeenCalled();
        });
    });
});