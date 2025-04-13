import gql from "graphql-tag";

const typeDefs = gql`
  scalar DateTime
  scalar Json
  scalar Upload

  type User {
    id: Int!
    firstName: String!
    lastName: String!
    role: String!
    gender: String!
    email: String!
    password: String!
    verified: Boolean!
  }

  type Car {
    id: Int!
    studentId: Int!
    carBrand: String!
    carModel: String!
    carModelYear: Int!
    numberOfSeats: Int!
  }

  type Request {
    id: Int!
    studentId: Int!
    firstName: String!
    lastName: String!
    gender: String!
    email: String!
    password: String!
    status: String!
  }

  enum DriverStatus {
    PENDING
    APPROVED
    REJECTED
  }

  type Driver {
    id: Int!
    userId: Int!
    licenseNumber: String!
    licenseImageUrl: String!
    status: DriverStatus!
    approvedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    car: DriverCar
  }

  type DriverCar {
    id: Int!
    make: String!
    model: String!
    year: Int!
    color: String!
    licensePlate: String!
    seatsAvailable: Int!
  }

  type DriverResponse {
    success: Boolean!
    message: String!
    driver: Driver
  }

  type AuthResponse {
    status: String!
    message: String!
    userId: Int
    role: String
  }

  input DriverInput {
    userId: Int!
    licenseNumber: String!
    carMake: String!
    carModel: String!
    carYear: Int!
    carColor: String!
    carLicensePlate: String!
    seatsAvailable: Int!
  }

  type Query {
    fetchAllRequests: [Request]
    login(email: String!, password: String!): AuthResponse
    rejectRequest(id: Int!): Request
    getPendingDrivers: [Driver]
    getDriverById(id: Int!): Driver
  }

  type Mutation {
    createRequest(
      studentId: Int!
      firstName: String!
      lastName: String!
      gender: String!
      email: String!
      password: String!
    ): Request
    acceptRequest(id: Int!): User
    registerDriver(
      file: Upload!
      userId: Int!
      licenseNumber: String!
      carMake: String!
      carModel: String!
      carYear: Int!
      carColor: String!
      carLicensePlate: String!
      seatsAvailable: Int!
    ): DriverResponse
    approveDriver(id: Int!): DriverResponse
    rejectDriver(id: Int!): DriverResponse
  }
`;

export default typeDefs;