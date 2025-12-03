import { Test, TestingModule } from '@nestjs/testing';
import { VersioningService } from './content/versioning.service';
import { PrismaService } from '@app/database';
import { prismaMock } from '../test/mockup/prisma.mock';

describe('VersioningService', () => {
    let versioningService: VersioningService;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [
                VersioningService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        versioningService = app.get<VersioningService>(VersioningService);

        jest.clearAllMocks();
    });

    it('should create a snapshot', async () => {
        const contentId = "1", content = "C", version = 1, title = "T";

        const mockResult = { contentId, content, version, title };
        prismaMock.version.create.mockResolvedValue(mockResult);

        const result = await versioningService.createSnapshot(contentId, content, version, title);

        expect(prismaMock.version.create).toHaveBeenCalledWith({
        data: {
            contentId,
            content,
            version,
            title,
            body: null
        },
        });

        expect(result).toEqual(mockResult);
    });

});