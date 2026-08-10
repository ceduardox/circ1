-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('REFLECTION', 'AFFIRMATION', 'VIDEO', 'QUIZ', 'MENTAL_EXERCISE', 'CONFIDENCE_TASK');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReflectionType" AS ENUM ('DREAMS', 'FEARS', 'ENTHUSIASM', 'CUSTOM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "age" INTEGER,
    "country" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_days" (
    "id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "unlock_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_contents" (
    "id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "day_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PENDING',
    "answers" JSONB,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reflections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "reflection_type" "ReflectionType" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "program_days_day_number_key" ON "program_days"("day_number");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_content_id_key" ON "user_progress"("user_id", "content_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_reflections_user_id_day_id_reflection_type_key" ON "user_reflections"("user_id", "day_id", "reflection_type");

-- AddForeignKey
ALTER TABLE "day_contents" ADD CONSTRAINT "day_contents_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "program_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "program_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "day_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reflections" ADD CONSTRAINT "user_reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reflections" ADD CONSTRAINT "user_reflections_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "program_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
