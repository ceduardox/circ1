-- CreateEnum
CREATE TYPE "TikTokCreatorStatus" AS ENUM ('PENDIENTE', 'ACEPTADO', 'ACTIVO');

-- CreateEnum
CREATE TYPE "TikTokCommissionType" AS ENUM ('STUDENT', 'SPONSOR');

-- CreateEnum
CREATE TYPE "TikTokCommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "PaymentType" ADD VALUE 'CREATOR_EXTRA';

-- AlterTable
ALTER TABLE "membership_payments" ADD COLUMN     "campaign_id" TEXT;

-- CreateTable
CREATE TABLE "tiktok_shop_campaigns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pack_type" INTEGER NOT NULL DEFAULT 500,
    "base_creators" INTEGER NOT NULL DEFAULT 5,
    "extra_creators" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiktok_shop_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiktok_creators" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tiktok_url" TEXT,
    "status" "TikTokCreatorStatus" NOT NULL DEFAULT 'PENDIENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiktok_creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiktok_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "sponsor_rate" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiktok_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiktok_sales" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tiktok_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiktok_commissions" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TikTokCommissionType" NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TikTokCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "tiktok_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tiktok_shop_campaigns_user_id_key" ON "tiktok_shop_campaigns"("user_id");

-- AddForeignKey
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "tiktok_shop_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiktok_shop_campaigns" ADD CONSTRAINT "tiktok_shop_campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiktok_creators" ADD CONSTRAINT "tiktok_creators_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "tiktok_shop_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiktok_sales" ADD CONSTRAINT "tiktok_sales_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "tiktok_shop_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiktok_sales" ADD CONSTRAINT "tiktok_sales_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "tiktok_creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiktok_sales" ADD CONSTRAINT "tiktok_sales_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tiktok_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiktok_commissions" ADD CONSTRAINT "tiktok_commissions_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tiktok_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiktok_commissions" ADD CONSTRAINT "tiktok_commissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
