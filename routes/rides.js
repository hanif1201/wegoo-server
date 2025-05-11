// routes/rides.js
const express = require("express");
const {
  createRideRequest,
  getAvailableRides,
  acceptRideRequest,
  updateRideStatus,
  getUserRideHistory,
  getRiderRideHistory,
  rateRide,
} = require("../controllers/rideController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// User routes
router.post("/", protect, authorize("user"), createRideRequest);
router.get("/history", protect, authorize("user"), getUserRideHistory);

// Rider routes
router.get("/available", protect, authorize("rider"), getAvailableRides);
router.put("/:id/accept", protect, authorize("rider"), acceptRideRequest);
router.put("/:id/status", protect, authorize("rider"), updateRideStatus);
router.get("/rider-history", protect, authorize("rider"), getRiderRideHistory);

// Shared routes
router.post("/:id/rate", protect, rateRide);

module.exports = router;
