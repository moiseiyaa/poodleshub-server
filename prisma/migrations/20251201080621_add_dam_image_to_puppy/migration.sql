-- AlterTable
ALTER TABLE "Puppy" ADD COLUMN     "damImage" TEXT;

-- CreateIndex
CREATE INDEX "Application_displayId_idx" ON "Application"("displayId");
