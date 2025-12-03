export const prismaMock = {
    version: {
        create: jest.fn(),
    },
    content: {
        findMany: jest.fn(),
    },
    tag: {
        findUnique: jest.fn(),
    },
    tagsOnContents: {
        findMany: jest.fn(),
        create: jest.fn(),
    },
};