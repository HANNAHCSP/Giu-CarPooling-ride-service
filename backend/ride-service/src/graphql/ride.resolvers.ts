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

    getAllZones: () => rideService.getAllZones(),
    getZone: (_: any, { id }: { id: number }) => rideService.getZone(id),
    getRoutesByZone: (_: any, { zoneId }: { zoneId: number }) =>
      rideService.getRoutesByZone(zoneId),
    getMeetingPointsByRoute: (_: any, { routeId }: { routeId: number }) =>
      rideService.getMeetingPointsByRoute(routeId),

    calculateRidePrice: (
      _: any,
      {
        originId,
        destinationId,
        seatsTotal,
      }: { originId: number; destinationId: number; seatsTotal: number }
    ) => rideService.calculateRidePrice(originId, destinationId, seatsTotal),

    // Subzone Queries
    getSubzonesByRoute: (_: any, { routeId }: { routeId: number }) =>
      rideService.getSubzonesByRoute(routeId),

    getSubzone: (_: any, { id }: { id: number }) => rideService.getSubzone(id),
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

    createZone: (_: any, { name, baseFare, costPerMin, costPerKm }: any) =>
      rideService.createZone(name, baseFare, costPerMin, costPerKm),

    createRoute: (_: any, { zoneId, name }: any) =>
      rideService.createRoute(zoneId, name),

    createMeetingPoint: (
      _: any,
      { routeId, name, distanceToGiu, timeToGiu, latitude, longitude }: any
    ) =>
      rideService.createMeetingPoint(
        routeId,
        name,
        distanceToGiu,
        timeToGiu,
        latitude,
        longitude
      ),

    // Subzone Mutations
    createSubzone: (
      _: any,
      {
        routeId,
        name,
        baseFare,
        costPerMin,
        costPerKm,
      }: {
        routeId: number;
        name: string;
        baseFare: number;
        costPerMin: number;
        costPerKm: number;
      }
    ) =>
      rideService.createSubzone(routeId, name, baseFare, costPerMin, costPerKm),

    assignMeetingPointToSubzone: (
      _: any,
      {
        meetingPointId,
        subzoneId,
      }: { meetingPointId: number; subzoneId: number }
    ) => rideService.assignMeetingPointToSubzone(meetingPointId, subzoneId),
  },
};
