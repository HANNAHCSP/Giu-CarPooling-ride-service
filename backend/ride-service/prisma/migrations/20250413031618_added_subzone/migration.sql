-- AlterTable
ALTER TABLE "MeetingPoint" ADD COLUMN     "subzoneId" INTEGER;

-- CreateTable
CREATE TABLE "Subzone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "routeId" INTEGER NOT NULL,
    "baseFare" DOUBLE PRECISION NOT NULL,
    "costPerMin" DOUBLE PRECISION NOT NULL,
    "costPerKm" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Subzone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subzone_name_key" ON "Subzone"("name");

-- AddForeignKey
ALTER TABLE "Subzone" ADD CONSTRAINT "Subzone_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingPoint" ADD CONSTRAINT "MeetingPoint_subzoneId_fkey" FOREIGN KEY ("subzoneId") REFERENCES "Subzone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
