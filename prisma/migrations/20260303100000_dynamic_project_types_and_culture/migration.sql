-- Migration: Convert projectType enum to projectTypes string array, culture enum to string
-- This migration preserves all existing data

-- Step 1: Add new columns
ALTER TABLE "projects" ADD COLUMN "projectTypes_new" TEXT[];
ALTER TABLE "projects" ADD COLUMN "culture_new" TEXT;

-- Step 2: Migrate data from old columns to new columns
-- Convert single projectType enum to array with one element
UPDATE "projects" SET "projectTypes_new" = ARRAY["projectType"::TEXT];
UPDATE "projects" SET "culture_new" = "culture"::TEXT;

-- Step 3: Drop old columns
ALTER TABLE "projects" DROP COLUMN "projectType";
ALTER TABLE "projects" DROP COLUMN "culture";

-- Step 4: Rename new columns to final names
ALTER TABLE "projects" RENAME COLUMN "projectTypes_new" TO "projectTypes";
ALTER TABLE "projects" RENAME COLUMN "culture_new" TO "culture";

-- Step 5: Add NOT NULL constraint to culture (projectTypes can be empty array but not null)
ALTER TABLE "projects" ALTER COLUMN "culture" SET NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "projectTypes" SET NOT NULL;

-- Step 6: Drop the old enum types (they're no longer used)
DROP TYPE IF EXISTS "ProjectType";
DROP TYPE IF EXISTS "Culture";
