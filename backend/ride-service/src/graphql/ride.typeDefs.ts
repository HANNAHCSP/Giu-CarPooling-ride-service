import { gql } from "apollo-server";

export const typeDefs = gql`
  type Car {
    id: Int!
    model: String!
    color: String!
    plateNumber: String!
    totalSeats: Int!
  }

  type Driver {
    id: Int!
    name: String!
    email: String!
    phoneNumber: String!
    gender: String!
    approved: Boolean!
  }
  type Subzone {
    id: Int!
    name: String!
    routeId: Int!
    baseFare: Float!
    costPerMin: Float!
    costPerKm: Float!
    route: Route
    meetingPoints: [MeetingPoint!]
  }

  # Update MeetingPoint type
  type MeetingPoint {
    id: Int!
    name: String!
    routeId: Int!
    subzoneId: Int
    distanceToGiu: Float!
    timeToGiu: Int!
    latitude: Float
    longitude: Float
    route: Route
    subzone: Subzone
  }

  type Route {
    id: Int!
    name: String!
    zoneId: Int!
    zone: Zone
    meetingPoints: [MeetingPoint!]
  }

  type Zone {
    id: Int!
    name: String!
    baseFare: Float!
    costPerMin: Float!
    costPerKm: Float!
    routes: [Route!]
  }

  type Ride {
    id: Int!
    driverId: Int!
    carId: Int!
    fromGiu: Boolean!
    girlsOnly: Boolean!
    price: Float!
    seatsLeft: Int!
    active: Boolean!
    createdAt: String!
    departureTime: String!
    car: Car
    driver: Driver
    origin: MeetingPoint
    destination: MeetingPoint
    estimatedTime: Int
    distance: Float
  }

  input CreateRideInput {
    driverId: Int!
    carId: Int!
    originId: Int!
    destinationId: Int!
    fromGiu: Boolean!
    girlsOnly: Boolean!
    departureTime: String!
  }

  input RideFilters {
    fromGiu: Boolean
    girlsOnly: Boolean
    zoneId: Int
    routeId: Int
    originId: Int
    destinationId: Int
  }

  type PriceQuote {
    price: Float!
    distance: Float!
    estimatedTime: Int!
    origin: MeetingPoint!
    destination: MeetingPoint!
  }

  type Query {
    getRide(id: Int!): Ride
    getAllRides: [Ride]
    getDriverRideHistory(driverId: Int!): [Ride]
    getFilteredRides(filters: RideFilters): [Ride]
    getAllZones: [Zone]
    getZone(id: Int!): Zone
    getRoutesByZone(zoneId: Int!): [Route]
    getMeetingPointsByRoute(routeId: Int!): [MeetingPoint]
    calculateRidePrice(
      originId: Int!
      destinationId: Int!
      seatsTotal: Int!
    ): PriceQuote
    getSubzonesByRoute(routeId: Int!): [Subzone]
    getSubzone(id: Int!): Subzone
  }

  type Mutation {
    createRide(input: CreateRideInput!): Ride
    updateSeatsLeft(rideId: Int!, delta: Int!): Ride
    deactivateRide(rideId: Int!): Ride
    cancelRideByDriver(rideId: Int!, driverId: Int!): Ride

    # Administrative mutations for managing zones/routes/points
    createZone(
      name: String!
      baseFare: Float!
      costPerMin: Float!
      costPerKm: Float!
    ): Zone
    createRoute(zoneId: Int!, name: String!): Route
    createMeetingPoint(
      routeId: Int!
      name: String!
      distanceToGiu: Float!
      timeToGiu: Int!
      latitude: Float
      longitude: Float
    ): MeetingPoint

    createSubzone(
      routeId: Int!
      name: String!
      baseFare: Float!
      costPerMin: Float!
      costPerKm: Float!
    ): Subzone
    assignMeetingPointToSubzone(
      meetingPointId: Int!
      subzoneId: Int!
    ): MeetingPoint
  }
`;
