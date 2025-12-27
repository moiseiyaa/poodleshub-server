-- CreateTable
CREATE TABLE "SeoMeta" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "focusKeywords" TEXT[],
    "slug" TEXT,
    "canonicalUrl" TEXT,
    "robots" TEXT NOT NULL DEFAULT 'INDEX',
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "schemaType" TEXT,
    "customMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeoMeta_slug_key" ON "SeoMeta"("slug");

-- CreateIndex
CREATE INDEX "SeoMeta_entityId_idx" ON "SeoMeta"("entityId");

-- CreateIndex
CREATE INDEX "SeoMeta_entityType_idx" ON "SeoMeta"("entityType");

-- CreateIndex
CREATE INDEX "SeoMeta_slug_idx" ON "SeoMeta"("slug");
