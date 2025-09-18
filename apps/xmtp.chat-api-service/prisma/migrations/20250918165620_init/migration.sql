-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('ens', 'basenames', 'farcaster', 'unstoppabledomains');

-- CreateTable
CREATE TABLE "public"."Profile" (
    "id" TEXT NOT NULL,
    "inboxId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "location" TEXT,
    "status" TEXT,
    "avatar" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_address_key" ON "public"."Profile"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_identity_key" ON "public"."Profile"("identity");
