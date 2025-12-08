-- CreateTable
CREATE TABLE "File" (
    "fileId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bucketName" TEXT NOT NULL DEFAULT 'itsvn',
    "objectKey" TEXT NOT NULL,
    "checksum" TEXT,
    "metadata" JSONB,
    "uploadedBy" TEXT,
    "contentId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "File_pkey" PRIMARY KEY ("fileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_bucketName_objectKey_key" ON "File"("bucketName", "objectKey");

-- CreateIndex
CREATE INDEX "File_fileName_idx" ON "File"("fileName");

-- CreateIndex
CREATE INDEX "File_fileType_idx" ON "File"("fileType");

-- CreateIndex
CREATE INDEX "File_uploadedBy_idx" ON "File"("uploadedBy");

-- CreateIndex
CREATE INDEX "File_contentId_idx" ON "File"("contentId");

-- CreateIndex
CREATE INDEX "File_bucketName_idx" ON "File"("bucketName");

-- CreateIndex
CREATE INDEX "File_uploadedAt_idx" ON "File"("uploadedAt");

-- CreateIndex
CREATE INDEX "File_deletedAt_idx" ON "File"("deletedAt");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
