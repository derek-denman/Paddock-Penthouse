-- AlterTable
ALTER TABLE "User"
ADD COLUMN "cognitoSub" TEXT,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_cognitoSub_key" ON "User"("cognitoSub");
