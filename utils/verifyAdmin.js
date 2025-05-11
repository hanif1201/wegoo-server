const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const verifyAdmin = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const admin = await User.findOne({ role: "admin" }).select("+passwordHash");

    if (admin) {
      console.log("Admin found:", {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        hasPassword: !!admin.passwordHash,
      });
    } else {
      console.log("No admin user found in database");
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
  }
};

verifyAdmin();
