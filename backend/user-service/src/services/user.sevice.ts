import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as path from "path";
import * as fs from "fs";
import { createWriteStream } from "fs";
import { prisma } from "../database/prismaClient";

export class UserService {
  // Handle file upload and save locally
  async saveUploadedFile(file: any): Promise<string> {
    // GraphQL Upload file contains createReadStream, filename, mimetype, encoding
    const { createReadStream, filename, mimetype } = await file;

    const uploadDir = path.join(process.cwd(), "uploads", "licenses");

    // Create the upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create a unique filename to avoid collisions
    const uniqueFilename = `${Date.now()}-${filename}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    const fileUrl = `/uploads/licenses/${uniqueFilename}`;

    // Create a write stream to save the file
    const writeStream = createWriteStream(filePath);

    // Create read stream from the uploaded file
    const stream = createReadStream();

    // Process the file upload
    await new Promise((resolve, reject) => {
      stream.pipe(writeStream).on("finish", resolve).on("error", reject);
    });

    return fileUrl;
  }

  // Create request
  async createRequest(userData: {
    studentId: number;
    firstName: string;
    lastName: string;
    gender: string;
    email: string;
    password: string;
  }) {
    const rounds = Number(process.env.SALT_ROUNDS || 10);
    const userPassword = await bcrypt.hash(userData.password, rounds);

    return prisma.request.create({
      data: {
        studentId: userData.studentId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        gender: userData.gender,
        email: userData.email,
        password: userPassword,
        status: "Pending",
      },
    });
  }

  // Fetch all requests
  async fetchAllRequests() {
    return prisma.request.findMany();
  }

  // Reject request
  async rejectRequest(id: number) {
    return prisma.request.update({
      where: { id },
      data: { status: "Rejected" },
    });
  }

  // Accept request and create user
  async acceptRequest(id: number) {
    const request = await prisma.request.findUnique({
      where: { id },
    });

    if (!request) {
      throw new Error("Request not found");
    }

    return prisma.user.create({
      data: {
        id: request.studentId,
        firstName: request.firstName,
        lastName: request.lastName,
        role: "student",
        gender: request.gender,
        email: request.email,
        password: request.password,
        verified: true,
      },
    });
  }

  // Login
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { status: "failed", message: "User not found" };
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
      return {
        status: "success",
        message: "Logged in successfully",
        userId: user.id,
        role: user.role,
      };
    }

    return { status: "failed", message: "Invalid credentials" };
  }

  // Register driver (with transaction & upload)
  async registerDriver(
    file: any,
    driverData: {
      userId: number;
      licenseNumber: string;
      carMake: string;
      carModel: string;
      carYear: number;
      carColor: string;
      carLicensePlate: string;
      seatsAvailable: number;
    }
  ) {
    try {
      // First check if driver already exists
      const existingDriver = await prisma.driver.findUnique({
        where: { userId: driverData.userId },
      });

      if (existingDriver) {
        return {
          success: false,
          message: "You have already registered as a driver",
          driver: existingDriver,
        };
      }

      // Save the uploaded file and get its URL
      const licenseImageUrl = await this.saveUploadedFile(file);

      // Use a transaction to ensure both driver and car are created
      const driver = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const createdDriver = await tx.driver.create({
            data: {
              userId: driverData.userId,
              licenseNumber: driverData.licenseNumber,
              licenseImageUrl,
              status: "PENDING",
            },
          });

          await tx.driverCar.create({
            data: {
              driverId: createdDriver.id,
              make: driverData.carMake,
              model: driverData.carModel,
              year: driverData.carYear,
              color: driverData.carColor,
              licensePlate: driverData.carLicensePlate,
              seatsAvailable: driverData.seatsAvailable,
            },
          });

          return createdDriver;
        }
      );

      // Fetch the complete driver data with car information
      const fullDriverData = await prisma.driver.findUnique({
        where: { id: driver.id },
        include: { car: true },
      });

      return {
        success: true,
        message:
          "Driver registration submitted successfully and pending approval",
        driver: fullDriverData,
      };
    } catch (error: any) {
      console.error("Error registering driver:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to register driver",
        driver: null,
      };
    }
  }

  // Get all pending drivers
  async getPendingDrivers() {
    return prisma.driver.findMany({
      where: { status: "PENDING" },
      include: { car: true },
    });
  }

  // Get driver by id
  async getDriverById(id: number) {
    return prisma.driver.findUnique({
      where: { id },
      include: { car: true },
    });
  }

  // Approve driver
  async approveDriver(id: number) {
    try {
      const driver = await prisma.driver.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
        include: { car: true },
      });

      return {
        success: true,
        message: "Driver has been approved successfully",
        driver,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Failed to approve driver",
        driver: null,
      };
    }
  }

  // Reject driver
  async rejectDriver(id: number) {
    try {
      const driver = await prisma.driver.update({
        where: { id },
        data: { status: "REJECTED" },
        include: { car: true },
      });

      return {
        success: true,
        message: "Driver has been rejected",
        driver,
      };
    } catch (error: any) {
      console.error("Error rejecting driver:", error);
      return {
        success: false,
        message: error.message || "Failed to reject driver",
        driver: null,
      };
    }
  }
}

export default new UserService();
