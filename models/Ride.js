// models/Ride.js
const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  preferredRiderGender: {
    type: String,
    enum: ["male", "female", "no_preference"],
    default: "no_preference",
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rider",
    default: null,
  },
  pickupLocation: {
    address: {
      type: String,
      required: [true, "Please provide pickup address"],
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, "Please provide pickup latitude"],
      },
      longitude: {
        type: Number,
        required: [true, "Please provide pickup longitude"],
      },
    },
  },
  dropoffLocation: {
    address: {
      type: String,
      required: [true, "Please provide dropoff address"],
    },
    coordinates: {
      latitude: {
        type: Number,
        required: [true, "Please provide dropoff latitude"],
      },
      longitude: {
        type: Number,
        required: [true, "Please provide dropoff longitude"],
      },
    },
  },
  status: {
    type: String,
    enum: ["requested", "accepted", "in-progress", "completed", "cancelled"],
    default: "requested",
  },
  requestTime: {
    type: Date,
    default: Date.now,
  },
  acceptTime: Date,
  pickupTime: Date,
  dropoffTime: Date,
  fare: {
    baseFare: {
      type: Number,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["credit_card", "paypal", "cash"],
    default: "cash",
  },
  route: {
    distance: Number,
    duration: Number,
    polyline: String,
  },
  userRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  riderRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  userFeedback: String,
  riderFeedback: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
RideSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Ride", RideSchema);
