-- CreateTable
CREATE TABLE "transcriptions" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "text" TEXT,
    "error" TEXT,
    "durationSec" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcriptions_pkey" PRIMARY KEY ("id")
);
