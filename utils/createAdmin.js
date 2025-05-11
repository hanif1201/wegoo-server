// utils/createAdmin.js
const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const createAdmin = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminData = {
      name: "Admin User",
      email: "admin@example.com",
      phone: "+1234567890",
      passwordHash: "admin123",
      role: "admin",
    };

    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log("Admin user already exists");
      await mongoose.disconnect();
      return;
    }

    const admin = await User.create(adminData);
    console.log("Admin user created successfully:", {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error creating admin:", error);
    await mongoose.disconnect();
  }
};

// Run this script directly with: node utils/createAdmin.js
if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;
