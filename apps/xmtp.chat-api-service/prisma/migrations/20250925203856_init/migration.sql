-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('ens', 'basenames', 'unknown');

-- CreateTable
CREATE TABLE "public"."Profile" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "avatar" TEXT,
    "description" TEXT,
    "displayName" TEXT,
    "identity" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_identity_key" ON "public"."Profile"("identity");
