import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

import * as rideService from "../services/ride.service";

export const resolvers = {
  Query: {
    getRide: (_: any, { id }: { id: number }) => rideService.getRideById(id),
    getAllRides: () => rideService.getAllRides(),
    getDriverRideHistory: (_: any, { driverId }: { driverId: number }) =>
      rideService.getDriverRideHistory(driverId),
    getFilteredRides: (_: any, { filters }: { filters: any }) =>
      rideService.getFilteredRides(filters),
    searchRidesByLocation: (
      _: any,
      { locationQuery }: { locationQuery: string }
    ) => rideService.searchRidesByLocation(locationQuery),
  },
  Mutation: {
    createRide: (_: any, { input }: any) => rideService.createRide(input),
    updateSeatsLeft: (_: any, { rideId, delta }: any) =>
      rideService.updateSeatsLeft(rideId, delta),
    deactivateRide: (_: any, { rideId }: { rideId: number }) =>
      rideService.deactivateRide(rideId),
    cancelRideByDriver: (
      _: any,
      { rideId, driverId }: { rideId: number; driverId: number }
    ) => rideService.cancelRideByDriver(rideId, driverId),
  },
};
