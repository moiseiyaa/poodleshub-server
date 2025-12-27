-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PAGE', 'PUPPY', 'BREED', 'BLOG', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Robots" AS ENUM ('INDEX', 'NOINDEX', 'FOLLOW', 'NOFOLLOW', 'NOARCHIVE', 'NOSNIPPET', 'NOTRANSLATE', 'NOIMAGEINDEX', 'NONE');

-- CreateEnum
CREATE TYPE "SchemaType" AS ENUM ('WEBSITE', 'ARTICLE', 'PRODUCT', 'EVENT', 'ORGANIZATION', 'PERSON', 'LOCAL_BUSINESS', 'BREADCRUMB_LIST', 'ITEM_LIST', 'FAQ', 'HOW_TO', 'RECIPE', 'REVIEW', 'VIDEO_OBJECT', 'CUSTOM');

-- CreateTable
CREATE TABLE "SeoMeta" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "metaTitle" VARCHAR(100) NOT NULL,
    "metaDescription" VARCHAR(500) NOT NULL,
    "canonicalUrl" TEXT,
    "robots" "Robots" NOT NULL DEFAULT 'INDEX',
    "ogTitle" VARCHAR(100),
    "ogDescription" VARCHAR(500),
    "ogImage" TEXT,
    "schemaType" "SchemaType" NOT NULL DEFAULT 'WEBSITE',
    "schemaData" JSONB,
    "focusKeywords" TEXT[],
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "puppyName" TEXT,
    "puppyBreed" TEXT,
    "initials" TEXT,
    "date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeoMeta_slug_key" ON "SeoMeta"("slug");

-- CreateIndex
CREATE INDEX "SeoMeta_entityType_idx" ON "SeoMeta"("entityType");

-- CreateIndex
CREATE INDEX "SeoMeta_entityId_idx" ON "SeoMeta"("entityId");

-- CreateIndex
CREATE INDEX "SeoMeta_slug_idx" ON "SeoMeta"("slug");
