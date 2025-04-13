/*
  Warnings:

  - You are about to drop the column `location` on the `Ride` table. All the data in the column will be lost.
  - Added the required column `destinationId` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distance` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedTime` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originId` to the `Ride` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ride" DROP COLUMN "location",
ADD COLUMN     "destinationId" INTEGER NOT NULL,
ADD COLUMN     "distance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "estimatedTime" INTEGER NOT NULL,
ADD COLUMN     "originId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "baseFare" DOUBLE PRECISION NOT NULL,
    "costPerMin" DOUBLE PRECISION NOT NULL,
    "costPerKm" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "zoneId" INTEGER NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingPoint" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "routeId" INTEGER NOT NULL,
    "distanceToGiu" DOUBLE PRECISION NOT NULL,
    "timeToGiu" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "MeetingPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Route_zoneId_name_key" ON "Route"("zoneId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingPoint_routeId_name_key" ON "MeetingPoint"("routeId", "name");

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_originId_fkey" FOREIGN KEY ("originId") REFERENCES "MeetingPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "MeetingPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingPoint" ADD CONSTRAINT "MeetingPoint_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
