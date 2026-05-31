-- CreateTable
CREATE TABLE "dev_otp_logs" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_otp_logs_pkey" PRIMARY KEY ("id")
);
