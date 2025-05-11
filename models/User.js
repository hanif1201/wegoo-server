// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  phone: {
    type: String,
    required: [true, "Please add a phone number"],
    unique: true,
  },
  passwordHash: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false,
  },
  profilePicture: {
    type: String,
    default: "default-avatar.jpg",
  },
  homeAddress: {
    label: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  workAddress: {
    label: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  paymentMethods: [
    {
      type: {
        type: String,
        enum: ["credit_card", "paypal", "cash"],
        required: true,
      },
      details: {
        type: Object,
      },
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
  ],
  role: {
    type: String,
    enum: ["user", "admin", "rider"],
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Sign JWT and return

// Add these improved JWT token methods to User.js and Rider.js

// For User.js - Replace the existing getSignedJwtToken method
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model("User", UserSchema);
