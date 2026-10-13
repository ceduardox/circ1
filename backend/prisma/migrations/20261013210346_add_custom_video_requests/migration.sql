-- CreateEnum
CREATE TYPE "CustomVideoStatus" AS ENUM ('SOLICITADO', 'EN_PROCESO', 'ENTREGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "custom_video_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "CustomVideoStatus" NOT NULL DEFAULT 'SOLICITADO',
    "photos" JSONB,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_video_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_video_request_items" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "video_url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "custom_video_request_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "custom_video_requests" ADD CONSTRAINT "custom_video_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_video_request_items" ADD CONSTRAINT "custom_video_request_items_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "custom_video_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_video_request_items" ADD CONSTRAINT "custom_video_request_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tiktok_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
