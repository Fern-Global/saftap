-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'ON_CHAIN', 'CONVERTING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TOURIST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "baseAddress" TEXT NOT NULL,
    "encryptedKey" TEXT,
    "cdpWalletId" TEXT,
    "usdcBalance" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPayee" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "mpesaPhone" TEXT,
    "tillNumber" TEXT,
    "paybillNumber" TEXT,
    "accountRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPayee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "destinationPhone" TEXT,
    "destinationTill" TEXT,
    "savedPayeeId" UUID,
    "amountUsdc" DECIMAL(18,6) NOT NULL,
    "amountKes" DECIMAL(18,2) NOT NULL,
    "exchangeRate" DECIMAL(18,6) NOT NULL,
    "baseTxHash" TEXT,
    "darajaReceiptId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_baseAddress_idx" ON "Wallet"("baseAddress");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPayee" ADD CONSTRAINT "SavedPayee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_savedPayeeId_fkey" FOREIGN KEY ("savedPayeeId") REFERENCES "SavedPayee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
