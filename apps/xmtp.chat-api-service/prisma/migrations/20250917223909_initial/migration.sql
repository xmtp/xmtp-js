-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('ens', 'basenames', 'farcaster', 'unstoppabledomains');

-- CreateTable
CREATE TABLE "public"."Inbox" (
    "id" TEXT NOT NULL,
    "inboxId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" TEXT NOT NULL,
    "inboxId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Profile" (
    "id" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
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
CREATE UNIQUE INDEX "Inbox_inboxId_key" ON "public"."Inbox"("inboxId");

-- CreateIndex
CREATE UNIQUE INDEX "Address_address_key" ON "public"."Address"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_identity_key" ON "public"."Profile"("identity");

-- AddForeignKey
ALTER TABLE "public"."Address" ADD CONSTRAINT "Address_inboxId_fkey" FOREIGN KEY ("inboxId") REFERENCES "public"."Inbox"("inboxId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;
