-- CreateTable
CREATE TABLE "vip_pro_modules" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'Zap',
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "links" JSONB NOT NULL,
    "statNumber" TEXT,
    "statLabel" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vip_pro_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_pro_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vip_pro_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vip_pro_modules_slug_key" ON "vip_pro_modules"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vip_pro_progress_user_id_module_id_key" ON "vip_pro_progress"("user_id", "module_id");

-- AddForeignKey
ALTER TABLE "vip_pro_progress" ADD CONSTRAINT "vip_pro_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_pro_progress" ADD CONSTRAINT "vip_pro_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "vip_pro_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
