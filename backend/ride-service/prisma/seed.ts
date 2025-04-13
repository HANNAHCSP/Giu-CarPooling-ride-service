import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Seeding...");

  // ---------------- Zones ----------------
  console.log("Seeding Zones...");
  const zones = await prisma.zone.createMany({
    data: [
      { name: "Nasr City", baseFare: 20, costPerMin: 1, costPerKm: 2 },
      { name: "New Cairo", baseFare: 30, costPerMin: 2, costPerKm: 3 },
      { name: "6th October", baseFare: 50, costPerMin: 3, costPerKm: 4 },
    ],
  });

  const allZones = await prisma.zone.findMany();

  // ---------------- Routes ----------------
  console.log("Seeding Routes...");
  const routes = [];
  for (const zone of allZones) {
    for (let i = 1; i <= 2; i++) {
      const route = await prisma.route.create({
        data: {
          name: `Route ${zone.id}-${i}`,
          zoneId: zone.id,
        },
      });
      routes.push(route);
    }
  }

  // ---------------- Subzones ----------------
  console.log("Seeding Subzones...");
  const subzones = [];
  for (const route of routes) {
    const subzone = await prisma.subzone.create({
      data: {
        name: `Subzone ${route.id}`,
        routeId: route.id,
        baseFare: 10,
        costPerMin: 1,
        costPerKm: 1,
      },
    });
    subzones.push(subzone);
  }

  // ---------------- Meeting Points ----------------
  console.log("Seeding Meeting Points...");
  const meetingPoints = [];
  for (const route of routes) {
    for (let i = 1; i <= 3; i++) {
      const mp = await prisma.meetingPoint.create({
        data: {
          name: `Point ${route.id}-${i}`,
          routeId: route.id,
          subzoneId: subzones.find((s) => s.routeId === route.id)?.id,
          distanceToGiu: i * 5,
          timeToGiu: i * 10,
          latitude: 30 + Math.random(),
          longitude: 31 + Math.random(),
        },
      });
      meetingPoints.push(mp);
    }
  }

  // ---------------- Drivers ----------------
  console.log("Seeding Drivers...");
  const drivers = [];
  for (let i = 1; i <= 4; i++) {
    const driver = await prisma.driver.create({
      data: {
        name: `Driver ${i}`,
        email: `driver${i}@gmail.com`,
        phoneNumber: `0100000000${i}`,
        licenseNumber: `LIC00${i}`,
        gender: i % 2 === 0 ? "Female" : "Male",
        approved: i % 2 === 1, // Approve odd ones
      },
    });
    drivers.push(driver);
  }

  // ---------------- Cars ----------------
  console.log("Seeding Cars...");
  const cars = [];
  for (const driver of drivers) {
    for (let i = 1; i <= 2; i++) {
      const car = await prisma.car.create({
        data: {
          driverId: driver.id,
          model: `Model ${i}`,
          color: i % 2 === 0 ? "Black" : "White",
          plateNumber: `PLATE${driver.id}${i}`,
          totalSeats: 4,
        },
      });
      cars.push(car);
    }
  }

  // ---------------- Rides ----------------
  console.log("Seeding Rides...");
  for (let i = 1; i <= 20; i++) {
    const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
    const randomCar = cars.filter((c) => c.driverId === randomDriver.id)[0];
    const randomOrigin = meetingPoints[Math.floor(Math.random() * meetingPoints.length)];
    let randomDestination = meetingPoints[Math.floor(Math.random() * meetingPoints.length)];

    // Ensure origin != destination
    while (randomOrigin.id === randomDestination.id) {
      randomDestination = meetingPoints[Math.floor(Math.random() * meetingPoints.length)];
    }

    await prisma.ride.create({
      data: {
        driverId: randomDriver.id,
        carId: randomCar.id,
        originId: randomOrigin.id,
        destinationId: randomDestination.id,
        fromGiu: i % 2 === 0,
        girlsOnly: i % 3 === 0,
        price: 50 + i,
        seatsLeft: i % 5 === 0 ? 0 : 4,
        active: i % 7 !== 0,
        departureTime: new Date(Date.now() + (i - 10) * 86400000), // Mix past/future
        estimatedTime: 20,
        distance: 10,
      },
    });
  }

  console.log("✅ Seeding Completed Successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
