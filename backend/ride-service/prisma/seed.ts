import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Optional: clear previous test data
  await prisma.ride.deleteMany();
  await prisma.car.deleteMany();
  await prisma.driver.deleteMany();

  const drivers = [
    {
      name: 'Waleed Z.',
      email: 'waleed@giu.edu.eg',
      phoneNumber: '01012345678',
      licenseNumber: 'GIU1234',
      gender: 'Male',
      approved: true,
      car: {
        model: 'Hyundai Elantra',
        color: 'Black',
        plateNumber: 'WLD-123',
        totalSeats: 4,
      },
    },
    {
      name: 'Sara G.',
      email: 'sara.giu@edu.eg',
      phoneNumber: '01123456789',
      licenseNumber: 'GIU5678',
      gender: 'Female',
      approved: true,
      car: {
        model: 'Kia Picanto',
        color: 'Red',
        plateNumber: 'SAR-456',
        totalSeats: 3,
      },
    },
    {
      name: 'Ahmed M.',
      email: 'ahmed.m@giu.edu.eg',
      phoneNumber: '01234567890',
      licenseNumber: 'GIU9101',
      gender: 'Male',
      approved: true,
      car: {
        model: 'Toyota Corolla',
        color: 'White',
        plateNumber: 'AHM-789',
        totalSeats: 4,
      },
    },
  ];

  for (const d of drivers) {
    const driver = await prisma.driver.create({
      data: {
        name: d.name,
        email: d.email,
        phoneNumber: d.phoneNumber,
        licenseNumber: d.licenseNumber,
        gender: d.gender,
        approved: d.approved,
        cars: {
          create: {
            model: d.car.model,
            color: d.car.color,
            plateNumber: d.car.plateNumber,
            totalSeats: d.car.totalSeats,
          },
        },
      },
    });

    console.log(`✅ Created driver: ${driver.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
