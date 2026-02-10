-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('UPLOADING', 'UPLOADED', 'FAILED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "pending_uploads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'UPLOADING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_uploads_fileKey_key" ON "pending_uploads"("fileKey");

-- CreateIndex
CREATE INDEX "pending_uploads_userId_idx" ON "pending_uploads"("userId");

-- CreateIndex
CREATE INDEX "pending_uploads_status_idx" ON "pending_uploads"("status");

-- CreateIndex
CREATE INDEX "pending_uploads_expiresAt_idx" ON "pending_uploads"("expiresAt");

-- AddForeignKey
ALTER TABLE "pending_uploads" ADD CONSTRAINT "pending_uploads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
