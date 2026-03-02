-- CreateEnum
CREATE TYPE "PredictionOutcome" AS ENUM ('PENDING', 'CORRECT', 'INCORRECT');

-- CreateTable
CREATE TABLE "PitWallPrediction" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "predictionType" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "tokenCost" INTEGER NOT NULL DEFAULT 1,
    "outcome" "PredictionOutcome" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PitWallPrediction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PitWallPrediction" ADD CONSTRAINT "PitWallPrediction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "PlayerTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitWallPrediction" ADD CONSTRAINT "PitWallPrediction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
