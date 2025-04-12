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
  
  type Ride {
    id: Int!
    driverId: Int!
    carId: Int!
    location: String!
    fromGiu: Boolean!
    girlsOnly: Boolean!
    price: Float!
    seatsLeft: Int!
    active: Boolean!
    createdAt: String!
    departureTime: String!
    car: Car
    driver: Driver
  }

  input CreateRideInput {
    driverId: Int!
    carId: Int!
    location: String!
    fromGiu: Boolean!
    girlsOnly: Boolean!
    price: Float!
    departureTime: String!
  }

  input RideFilters {
    fromGiu: Boolean
    girlsOnly: Boolean
    locationQuery: String
  }

  type Query {
    getRide(id: Int!): Ride
    getAllRides: [Ride]
    getDriverRideHistory(driverId: Int!): [Ride]
    getFilteredRides(filters: RideFilters): [Ride]
    searchRidesByLocation(locationQuery: String!): [Ride]
  }

  type Mutation {
    createRide(input: CreateRideInput!): Ride
    updateSeatsLeft(rideId: Int!, delta: Int!): Ride
    deactivateRide(rideId: Int!): Ride
    cancelRideByDriver(rideId: Int!, driverId: Int!): Ride
  }
`;