// models/Rider.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const RiderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", "not_specified"],
    default: "not_specified",
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
    default: "default-rider.jpg",
  },
  vehicleDetails: {
    type: {
      type: String,
      enum: ["bike", "motorcycle", "car", "van", "truck"],
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
  },
  documents: [
    {
      type: {
        type: String,
        enum: [
          "license",
          "insurance",
          "vehicle_registration",
          "identity_proof",
        ],
        required: true,
      },
      fileUrl: {
        type: String,
        required: true,
      },
      verificationStatus: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      uploadDate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  currentLocation: {
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  isAvailable: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 0,
  },
  earnings: {
    total: {
      type: Number,
      default: 0,
    },
    currentWeek: {
      type: Number,
      default: 0,
    },
    currentDay: {
      type: Number,
      default: 0,
    },
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
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
RiderSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Sign JWT and return
RiderSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, type: "rider", role: "rider" },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    }
  );
};

// Match user entered password to hashed password in database
RiderSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model("Rider", RiderSchema);
