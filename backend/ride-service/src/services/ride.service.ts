import { prisma } from "../database/prismaClient";
import { ApolloError } from "apollo-server";

interface CreateRideInput {
  driverId: number;
  carId: number;
  location: string;
  fromGiu: boolean;
  girlsOnly: boolean;
  price: number;
  departureTime: string;
}

interface RideFilters {
  fromGiu?: boolean;
  girlsOnly?: boolean;
  locationQuery?: string;
}

// Not proud of the size of this function, but it's doing a lot. Will clean later.
export const createRide = async (input: CreateRideInput) => {
  try {
    const {
      driverId,
      carId,
      location,
      fromGiu,
      girlsOnly,
      price,
      departureTime,
    } = input;

    if (!location || location.trim() === "") {
      throw new ApolloError("Location is required", "INVALID_INPUT");
    }

    if (price <= 0) {
      throw new ApolloError("Price must be greater than zero", "INVALID_PRICE");
    }

    let parsedDeparture;
    try {
      parsedDeparture = new Date(departureTime);
    } catch (e) {
      console.error("Could not parse departureTime", e);
      throw new ApolloError("Bad date format", "INVALID_DATE");
    }

    if (parsedDeparture < new Date()) {
      throw new ApolloError("Departure must be in the future", "INVALID_DATE");
    }

    // Confirm driver exists + is allowed to create rides
    const driverInfo = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driverInfo) {
      throw new ApolloError("Driver not found", "NOT_FOUND");
    }

    if (!driverInfo.approved) {
      throw new ApolloError("Driver is not approved", "UNAUTHORIZED");
    }

    // Car ownership check
    const carInfo = await prisma.car.findUnique({ where: { id: carId } });

    if (!carInfo) {
      throw new ApolloError("Car not found", "NOT_FOUND");
    }

    if (carInfo.driverId !== driverId) {
      throw new ApolloError("Driver does not own this car", "INVALID_CAR");
    }

    const ride = await prisma.ride.create({
      data: {
        driverId,
        carId,
        location,
        fromGiu,
        girlsOnly,
        price,
        departureTime: parsedDeparture,
        seatsLeft: carInfo.totalSeats, // start full
        active: true,
      },
      include: {
        car: true,
        driver: true,
      },
    });

    return ride;
  } catch (err) {
    console.error("Error in createRide()", err);
    if (err instanceof ApolloError) throw err;
    throw new ApolloError("Ride creation failed", "DATABASE_ERROR");
  }
};

// Just pulls all active rides - maybe cache this later?
export const getAllRides = async () => {
  try {
    return await prisma.ride.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: {
        car: true,
        driver: true,
      },
    });
  } catch (err) {
    console.error("Error loading all rides:", err);
    throw new ApolloError("Could not fetch rides", "DATABASE_ERROR");
  }
};

export const getRideById = async (id: number) => {
  try {
    const rideDetails = await prisma.ride.findUnique({
      where: { id },
      include: {
        car: true,
        driver: true,
      },
    });

    if (!rideDetails) {
      throw new ApolloError("Ride not found", "NOT_FOUND");
    }

    return rideDetails;
  } catch (err) {
    console.error("Failed to fetch ride by ID:", err);
    if (err instanceof ApolloError) throw err;
    throw new ApolloError("Could not get ride", "DATABASE_ERROR");
  }
};

export const getDriverRideHistory = async (driverId: number) => {
  try {
    return await prisma.ride.findMany({
      where: { driverId },
      orderBy: { createdAt: "desc" },
      include: {
        car: true,
        driver: true,
      },
    });
  } catch (err) {
    console.error("Driver ride history lookup failed", err);
    throw new ApolloError("Failed to fetch ride history", "DATABASE_ERROR");
  }
};

export const getFilteredRides = async (filters: RideFilters) => {
  try {
    const { fromGiu, girlsOnly, locationQuery } = filters;

    // Constructing the filter object — will probably refactor this later.
    const whereStuff: any = {
      active: true,
    };

    if (fromGiu !== undefined) {
      whereStuff.fromGiu = fromGiu;
    }

    if (girlsOnly !== undefined) {
      whereStuff.girlsOnly = girlsOnly;
    }

    if (locationQuery && locationQuery.trim() !== "") {
      whereStuff.location = {
        contains: locationQuery,
        mode: "insensitive",
      };
    }

    return await prisma.ride.findMany({
      where: whereStuff,
      orderBy: { departureTime: "asc" },
      include: {
        car: true,
        driver: true,
      },
    });
  } catch (err) {
    console.error("Filtered ride fetch failed", err);
    throw new ApolloError("Ride filter failed", "DATABASE_ERROR");
  }
};

export const searchRidesByLocation = async (locationQuery: string) => {
  try {
    if (!locationQuery || locationQuery.trim() === "") {
      throw new ApolloError("Search needs a location string", "INVALID_INPUT");
    }

    return await prisma.ride.findMany({
      where: {
        active: true,
        location: {
          contains: locationQuery,
          mode: "insensitive",
        },
      },
      orderBy: { departureTime: "asc" },
      include: {
        car: true,
        driver: true,
      },
    });
  } catch (err) {
    console.error("Search by location failed", err);
    if (err instanceof ApolloError) throw err;
    throw new ApolloError("Location search failed", "DATABASE_ERROR");
  }
};

export const updateSeatsLeft = async (rideId: number, delta: number) => {
  try {
    const rideData = await prisma.ride.findUnique({ where: { id: rideId } });

    if (!rideData) {
      throw new ApolloError("Ride not found", "NOT_FOUND");
    }

    if (!rideData.active) {
      throw new ApolloError("Ride is no longer active", "INACTIVE_RIDE");
    }

    const updatedSeats = rideData.seatsLeft + delta;

    if (updatedSeats < 0) {
      throw new ApolloError("Too many passengers", "SEATS_UNAVAILABLE");
    }

    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: { seatsLeft: updatedSeats },
      include: {
        car: true,
        driver: true,
      },
    });

    // If no seats left, we shut it down
    if (updatedRide.seatsLeft === 0 && updatedRide.active) {
      return await prisma.ride.update({
        where: { id: rideId },
        data: { active: false },
        include: {
          car: true,
          driver: true,
        },
      });
    }

    return updatedRide;
  } catch (err) {
    console.error("Error updating ride seats", err);
    if (err instanceof ApolloError) throw err;
    throw new ApolloError("Seat update failed", "DATABASE_ERROR");
  }
};

// Basically a soft delete — useful for admins or expiration
export const deactivateRide = async (rideId: number) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });

    if (!ride) {
      throw new ApolloError("Ride not found", "NOT_FOUND");
    }

    return await prisma.ride.update({
      where: { id: rideId },
      data: { active: false },
      include: {
        car: true,
        driver: true,
      },
    });
  } catch (err) {
    console.error("Deactivation failed", err);
    if (err instanceof ApolloError) throw err;
    throw new ApolloError("Failed to deactivate ride", "DATABASE_ERROR");
  }
};

export const cancelRideByDriver = async (rideId: number, driverId: number) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });

    if (!ride) {
      throw new ApolloError("Ride not found", "NOT_FOUND");
    }

    if (ride.driverId !== driverId) {
      throw new ApolloError(
        "You can't cancel a ride you don't own",
        "UNAUTHORIZED"
      );
    }

    return await prisma.ride.update({
      where: { id: rideId },
      data: { active: false },
      include: {
        car: true,
        driver: true,
      },
    });
  } catch (err) {
    console.error("Cancel failed", err);
    if (err instanceof ApolloError) throw err;
    throw new ApolloError("Ride cancel failed", "DATABASE_ERROR");
  }
};
