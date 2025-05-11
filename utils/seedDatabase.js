// Example seed script (create a file like seedDatabase.js)
const mongoose = require("mongoose");
const User = require("../models/User");
const Rider = require("../models/Rider");
const Ride = require("../models/Ride");
require("dotenv").config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Rider.deleteMany({});
    await Ride.deleteMany({});

    // Create sample users
    const users = await User.create([
      {
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        passwordHash:
          "$2a$10$XfcHSDOJmHLaWG0Vz5T7C.jmuK9QzSOcqJuGiwhgLoOWz0R1YlzGq", // 'password123'
        status: "active",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "0987654321",
        passwordHash:
          "$2a$10$XfcHSDOJmHLaWG0Vz5T7C.jmuK9QzSOcqJuGiwhgLoOWz0R1YlzGq", // 'password123'
        status: "active",
      },
    ]);

    // Create sample riders
    const riders = await Rider.create([
      {
        name: "Mike Driver",
        email: "mike@example.com",
        phone: "1122334455",
        passwordHash:
          "$2a$10$XfcHSDOJmHLaWG0Vz5T7C.jmuK9QzSOcqJuGiwhgLoOWz0R1YlzGq", // 'password123'
        gender: "male",
        vehicleDetails: {
          type: "car",
          model: "Toyota Camry",
          licensePlate: "ABC123",
          color: "Blue",
        },
        verificationStatus: "approved",
      },
      {
        name: "Sarah Driver",
        email: "sarah@example.com",
        phone: "5544332211",
        passwordHash:
          "$2a$10$XfcHSDOJmHLaWG0Vz5T7C.jmuK9QzSOcqJuGiwhgLoOWz0R1YlzGq", // 'password123'
        gender: "female",
        vehicleDetails: {
          type: "car",
          model: "Honda Civic",
          licensePlate: "XYZ789",
          color: "Red",
        },
        verificationStatus: "approved",
      },
    ]);

    // Create sample rides
    await Ride.create([
      {
        userId: users[0]._id,
        riderId: riders[0]._id,
        pickupLocation: {
          address: "123 Main St, City",
          coordinates: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        },
        dropoffLocation: {
          address: "456 Park Ave, City",
          coordinates: {
            latitude: 40.758,
            longitude: -73.9855,
          },
        },
        status: "completed",
        requestTime: new Date(Date.now() - 86400000 * 3), // 3 days ago
        acceptTime: new Date(Date.now() - 86400000 * 3 + 300000), // 5 minutes after request
        pickupTime: new Date(Date.now() - 86400000 * 3 + 900000), // 15 minutes after request
        dropoffTime: new Date(Date.now() - 86400000 * 3 + 3600000), // 1 hour after request
        fare: {
          baseFare: 5,
          distance: 10,
          duration: 3,
          total: 18,
        },
        paymentStatus: "completed",
        paymentMethod: "cash",
        route: {
          distance: 8.5,
          duration: 25,
        },
        userRating: 5,
        riderRating: 4,
      },
      {
        userId: users[1]._id,
        riderId: riders[1]._id,
        pickupLocation: {
          address: "789 Broadway, City",
          coordinates: {
            latitude: 40.7484,
            longitude: -73.9857,
          },
        },
        dropoffLocation: {
          address: "321 Fifth Ave, City",
          coordinates: {
            latitude: 40.7448,
            longitude: -73.9867,
          },
        },
        status: "completed",
        requestTime: new Date(Date.now() - 86400000 * 1), // 1 day ago
        acceptTime: new Date(Date.now() - 86400000 * 1 + 180000), // 3 minutes after request
        pickupTime: new Date(Date.now() - 86400000 * 1 + 600000), // 10 minutes after request
        dropoffTime: new Date(Date.now() - 86400000 * 1 + 2400000), // 40 minutes after request
        fare: {
          baseFare: 5,
          distance: 7,
          duration: 2,
          total: 14,
        },
        paymentStatus: "completed",
        paymentMethod: "card",
        route: {
          distance: 5.3,
          duration: 15,
        },
        userRating: 4,
        riderRating: 5,
        preferredRiderGender: "female",
      },
    ]);

    console.log("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
