-- CreateTable
CREATE TABLE "tiktok_creator_pool" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "has_shop" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "web" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "videos" INTEGER NOT NULL DEFAULT 0,
    "profile_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tiktok_creator_pool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tiktok_creator_pool_username_key" ON "tiktok_creator_pool"("username");
