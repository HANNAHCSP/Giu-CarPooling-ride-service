import { prisma } from "../database/prismaClient";
import { ApolloError } from "apollo-server";

interface CreateRideInput {
  driverId: number;
  carId: number;
  originId: number;
  destinationId: number;
  fromGiu: boolean;
  girlsOnly: boolean;
  departureTime: string;
}

interface RideFilters {
  fromGiu?: boolean;
  girlsOnly?: boolean;
  zoneId?: number;
  routeId?: number;
  originId?: number;
  destinationId?: number;
}

// ================== Ride Services ==================

export const getRideById = async (id: number) => {
  try {
    const rideDetails = await prisma.ride.findUnique({
      where: { id },
      include: {
        car: true,
        driver: true,
        origin: true,
        destination: true,
      },
    });

    if (!rideDetails) throw new ApolloError("Ride not found", "NOT_FOUND");

    return rideDetails;
  } catch (err) {
    console.error("Failed to fetch ride by ID:", err);
    throw new ApolloError("Could not get ride", "DATABASE_ERROR");
  }
};

export const getAllRides = async () => {
  try {
    return await prisma.ride.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      include: {
        car: true,
        driver: true,
        origin: true,
        destination: true,
      },
    });
  } catch (err) {
    console.error("Error loading all rides:", err);
    throw new ApolloError("Could not fetch rides", "DATABASE_ERROR");
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
        origin: true,
        destination: true,
      },
    });
  } catch (err) {
    console.error("Driver ride history lookup failed", err);
    throw new ApolloError("Failed to fetch ride history", "DATABASE_ERROR");
  }
};

export const getFilteredRides = async (filters: RideFilters) => {
  try {
    const { fromGiu, girlsOnly, zoneId, routeId, originId, destinationId } =
      filters;

    const whereStuff: any = { active: true };

    if (fromGiu !== undefined) whereStuff.fromGiu = fromGiu;
    if (girlsOnly !== undefined) whereStuff.girlsOnly = girlsOnly;
    if (zoneId !== undefined) whereStuff.origin = { route: { zoneId } };
    if (routeId !== undefined)
      whereStuff.origin = { ...whereStuff.origin, routeId };
    if (originId !== undefined) whereStuff.originId = originId;
    if (destinationId !== undefined) whereStuff.destinationId = destinationId;

    return await prisma.ride.findMany({
      where: whereStuff,
      orderBy: { departureTime: "asc" },
      include: {
        car: true,
        driver: true,
        origin: true,
        destination: true,
      },
    });
  } catch (err) {
    console.error("Filtered ride fetch failed", err);
    throw new ApolloError("Ride filter failed", "DATABASE_ERROR");
  }
};

export const calculateRidePrice = async (
  originId: number,
  destinationId: number,
  seatsTotal: number
) => {
  try {
    const origin = await prisma.meetingPoint.findUnique({
      where: { id: originId },
      include: { 
        route: { include: { zone: true } },
        subzone: true
      },
    });

    const destination = await prisma.meetingPoint.findUnique({
      where: { id: destinationId },
      include: { 
        route: { include: { zone: true } },
        subzone: true
      },
    });

    if (!origin || !destination)
      throw new ApolloError("Meeting point not found", "NOT_FOUND");
    if (destinationId === originId)
      throw new ApolloError(
        "Origin and destination cannot be the same",
        "INVALID_INPUT"
      );

    let distance: number;
    let estimatedTime: number;

    const isGiuDestination = destination.distanceToGiu === 0;
    const isGiuOrigin = origin.distanceToGiu === 0;

    if (isGiuDestination) {
      // This is the case when we're going TO GIU
      distance = origin.distanceToGiu;
      estimatedTime = origin.timeToGiu;
    } else if (isGiuOrigin) {
      // This is the case when we're coming FROM GIU
      distance = destination.distanceToGiu;
      estimatedTime = destination.timeToGiu;
    } else {
      throw new ApolloError(
        "Invalid ride: must be either to or from GIU",
        "INVALID_RIDE"
      );
    }

    // Determine pricing tier:
    // If the origin has a subzone, use its pricing
    // Otherwise, fall back to the zone pricing
    let baseFare: number;
    let costPerMin: number;
    let costPerKm: number;

    // If going to GIU, use origin's pricing tier
    // If coming from GIU, use destination's pricing tier
    const pricingPoint = isGiuDestination ? origin : destination;

    if (pricingPoint.subzone) {
      // Use subzone pricing if available
      baseFare = pricingPoint.subzone.baseFare;
      costPerMin = pricingPoint.subzone.costPerMin;
      costPerKm = pricingPoint.subzone.costPerKm;
    } else {
      // Fall back to zone pricing
      const zone = pricingPoint.route.zone;
      baseFare = zone.baseFare;
      costPerMin = zone.costPerMin;
      costPerKm = zone.costPerKm;
    }

    const timeCost = costPerMin * estimatedTime;
    const distanceCost = costPerKm * distance;

    const totalBeforeSeats = baseFare + (timeCost + distanceCost);
    const price = Math.round((totalBeforeSeats / seatsTotal) * 100) / 100;

    return { price, distance, estimatedTime, origin, destination };
  } catch (err) {
    console.error("Error calculating ride price:", err);
    throw new ApolloError("Failed to calculate ride price", "DATABASE_ERROR");
  }
};

export const createRide = async (input: CreateRideInput) => {
  try {
    const {
      driverId,
      carId,
      originId,
      destinationId,
      fromGiu,
      girlsOnly,
      departureTime,
    } = input;

    const driverInfo = await prisma.driver.findUnique({
      where: { id: driverId },
    });
    if (!driverInfo) throw new ApolloError("Driver not found", "NOT_FOUND");
    if (!driverInfo.approved)
      throw new ApolloError("Driver not approved", "UNAUTHORIZED");

    const carInfo = await prisma.car.findUnique({ where: { id: carId } });
    if (!carInfo) throw new ApolloError("Car not found", "NOT_FOUND");
    if (carInfo.driverId !== driverId)
      throw new ApolloError("Driver doesn't own this car", "INVALID_CAR");

    const parsedDeparture = new Date(departureTime);
    if (parsedDeparture < new Date())
      throw new ApolloError("Departure must be future date", "INVALID_DATE");

    const priceData = await calculateRidePrice(
      originId,
      destinationId,
      carInfo.totalSeats
    );

    return await prisma.ride.create({
      data: {
        driverId,
        carId,
        originId,
        destinationId,
        fromGiu,
        girlsOnly,
        price: priceData.price,
        departureTime: parsedDeparture,
        seatsLeft: carInfo.totalSeats,
        active: true,
        estimatedTime: priceData.estimatedTime,
        distance: priceData.distance,
      },
      include: {
        car: true,
        driver: true,
        origin: true,
        destination: true,
      },
    });
  } catch (err) {
    console.error("Error in createRide()", err);
    throw new ApolloError("Ride creation failed", "DATABASE_ERROR");
  }
};

export const updateSeatsLeft = async (rideId: number, delta: number) => {
  try {
    const rideData = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!rideData) throw new ApolloError("Ride not found", "NOT_FOUND");

    const updatedSeats = rideData.seatsLeft + delta;
    if (updatedSeats < 0)
      throw new ApolloError("Too many passengers", "SEATS_UNAVAILABLE");

    return await prisma.ride.update({
      where: { id: rideId },
      data: { seatsLeft: updatedSeats },
      include: {
        car: true,
        driver: true,
        origin: true,
        destination: true,
      },
    });
  } catch (err) {
    console.error("Error updating ride seats", err);
    throw new ApolloError("Seat update failed", "DATABASE_ERROR");
  }
};

export const deactivateRide = async (rideId: number) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new ApolloError("Ride not found", "NOT_FOUND");

    return await prisma.ride.update({
      where: { id: rideId },
      data: { active: false },
      include: {
        car: true,
        driver: true,
        origin: true,
        destination: true,
      },
    });
  } catch (err) {
    console.error("Deactivation failed", err);
    throw new ApolloError("Failed to deactivate ride", "DATABASE_ERROR");
  }
};

export const cancelRideByDriver = async (rideId: number, driverId: number) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new ApolloError("Ride not found", "NOT_FOUND");
    if (ride.driverId !== driverId)
      throw new ApolloError("Unauthorized", "UNAUTHORIZED");

    return await prisma.ride.update({
      where: { id: rideId },
      data: { active: false },
      include: {
        car: true,
        driver: true,
        origin: true,
        destination: true,
      },
    });
  } catch (err) {
    console.error("Cancel failed", err);
    throw new ApolloError("Ride cancel failed", "DATABASE_ERROR");
  }
};

// ================== Zone Services ==================

export const getAllZones = async () => {
  try {
    return await prisma.zone.findMany({
      include: { routes: { include: { meetingPoints: true } } },
    });
  } catch (err) {
    console.error("Error fetching zones:", err);
    throw new ApolloError("Failed to fetch zones", "DATABASE_ERROR");
  }
};

export const getZone = async (id: number) => {
  try {
    const zone = await prisma.zone.findUnique({
      where: { id },
      include: { routes: { include: { meetingPoints: true } } },
    });
    if (!zone) throw new ApolloError("Zone not found", "NOT_FOUND");
    return zone;
  } catch (err) {
    console.error("Error fetching zone:", err);
    throw new ApolloError("Failed to fetch zone", "DATABASE_ERROR");
  }
};

export const getRoutesByZone = async (zoneId: number) => {
  try {
    return await prisma.route.findMany({
      where: { zoneId },
      include: { meetingPoints: true },
    });
  } catch (err) {
    console.error("Error fetching routes by zone:", err);
    throw new ApolloError("Failed to fetch routes", "DATABASE_ERROR");
  }
};

export const getMeetingPointsByRoute = async (routeId: number) => {
  try {
    return await prisma.meetingPoint.findMany({ where: { routeId } });
  } catch (err) {
    console.error("Error fetching meeting points by route:", err);
    throw new ApolloError("Failed to fetch meeting points", "DATABASE_ERROR");
  }
};

export const createZone = async (
  name: string,
  baseFare: number,
  costPerMin: number,
  costPerKm: number
) => {
  try {
    if (baseFare < 0 || costPerMin < 0 || costPerKm < 0)
      throw new ApolloError("Cost values must be positive", "INVALID_INPUT");
    return await prisma.zone.create({
      data: { name, baseFare, costPerMin, costPerKm },
    });
  } catch (err) {
    console.error("Error creating zone:", err);
    throw new ApolloError("Failed to create zone", "DATABASE_ERROR");
  }
};

export const createRoute = async (zoneId: number, name: string) => {
  try {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) throw new ApolloError("Zone not found", "NOT_FOUND");

    return await prisma.route.create({ data: { name, zoneId } });
  } catch (err) {
    console.error("Error creating route:", err);
    throw new ApolloError("Failed to create route", "DATABASE_ERROR");
  }
};

export const createMeetingPoint = async (
  routeId: number,
  name: string,
  distanceToGiu: number,
  timeToGiu: number,
  latitude?: number,
  longitude?: number
) => {
  try {
    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new ApolloError("Route not found", "NOT_FOUND");

    if (distanceToGiu < 0 || timeToGiu < 0)
      throw new ApolloError("Invalid distance or time", "INVALID_INPUT");

    return await prisma.meetingPoint.create({
      data: { name, routeId, distanceToGiu, timeToGiu, latitude, longitude },
    });
  } catch (err) {
    console.error("Error creating meeting point:", err);
    throw new ApolloError("Failed to create meeting point", "DATABASE_ERROR");
  }
};

// Subzone Services
export const getSubzonesByRoute = async (routeId: number) => {
  try {
    return await prisma.subzone.findMany({
      where: { routeId },
      include: { meetingPoints: true }
    });
  } catch (err) {
    console.error("Error fetching subzones by route:", err);
    throw new ApolloError("Failed to fetch subzones", "DATABASE_ERROR");
  }
};

export const getSubzone = async (id: number) => {
  try {
    const subzone = await prisma.subzone.findUnique({
      where: { id },
      include: { meetingPoints: true }
    });
    if (!subzone) throw new ApolloError("Subzone not found", "NOT_FOUND");
    return subzone;
  } catch (err) {
    console.error("Error fetching subzone:", err);
    throw new ApolloError("Failed to fetch subzone", "DATABASE_ERROR");
  }
};

export const createSubzone = async (
  routeId: number,
  name: string,
  baseFare: number,
  costPerMin: number,
  costPerKm: number
) => {
  try {
    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new ApolloError("Route not found", "NOT_FOUND");

    if (baseFare < 0 || costPerMin < 0 || costPerKm < 0)
      throw new ApolloError("Cost values must be positive", "INVALID_INPUT");

    return await prisma.subzone.create({
      data: { routeId, name, baseFare, costPerMin, costPerKm }
    });
  } catch (err) {
    console.error("Error creating subzone:", err);
    throw new ApolloError("Failed to create subzone", "DATABASE_ERROR");
  }
};

export const assignMeetingPointToSubzone = async (
  meetingPointId: number,
  subzoneId: number
) => {
  try {
    const meetingPoint = await prisma.meetingPoint.findUnique({
      where: { id: meetingPointId }
    });
    if (!meetingPoint) throw new ApolloError("Meeting point not found", "NOT_FOUND");

    const subzone = await prisma.subzone.findUnique({ where: { id: subzoneId } });
    if (!subzone) throw new ApolloError("Subzone not found", "NOT_FOUND");

    // Ensure meeting point and subzone belong to the same route
    if (meetingPoint.routeId !== subzone.routeId) {
      throw new ApolloError(
        "Meeting point and subzone must belong to the same route",
        "INVALID_RELATIONSHIP"
      );
    }

    return await prisma.meetingPoint.update({
      where: { id: meetingPointId },
      data: { subzoneId },
      include: { route: true, subzone: true }
    });
  } catch (err) {
    console.error("Error assigning meeting point to subzone:", err);
    throw new ApolloError("Failed to assign meeting point to subzone", "DATABASE_ERROR");
  }
};