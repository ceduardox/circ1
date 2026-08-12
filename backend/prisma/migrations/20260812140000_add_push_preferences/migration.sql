-- AlterTable
ALTER TABLE "users" ADD COLUMN "push_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "push_chat" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "push_commissions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "push_payments" BOOLEAN NOT NULL DEFAULT true;
