import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: 1,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      gender: "other",
      email: "admin@example.com",
      password: adminPassword,
      verified: true,
    },
  });

  // Create a test student user
  const studentPassword = await bcrypt.hash("student123", 10);

  const student = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: {
      id: 2,
      firstName: "Test",
      lastName: "Student",
      role: "student",
      gender: "male",
      email: "student@example.com",
      password: studentPassword,
      verified: true,
    },
  });

  console.log({ admin, student });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
