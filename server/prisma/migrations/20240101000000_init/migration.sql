-- CreateTable
CREATE TABLE "Generation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "length" TEXT,
    "shape" TEXT,
    "decoration" TEXT,
    "color" TEXT,
    "refImage" TEXT,
    "images" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,

    CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);
