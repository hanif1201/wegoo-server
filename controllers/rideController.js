// controllers/rideController.js
const Ride = require("../models/Ride");
const User = require("../models/User");
const Rider = require("../models/Rider");
const notificationService = require("../services/notificationService");

// @desc    Create a new ride request
// @route   POST /api/rides
// @access  Private (User only)
exports.createRideRequest = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      preferredRiderGender,
      fare,
      paymentMethod,
    } = req.body;

    // Create ride request
    const ride = await Ride.create({
      userId: req.user.id,
      pickupLocation,
      dropoffLocation,
      preferredRiderGender,
      fare,
      paymentMethod,
    });

    // Notify nearby riders about new ride request
    notificationService.notifyNearbyRiders(ride);

    res.status(201).json({
      success: true,
      data: ride,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get all available ride requests (for riders)
// @route   GET /api/rides/available
// @access  Private (Rider only)
exports.getAvailableRides = async (req, res) => {
  try {
    // Get rider's gender for filtering
    const rider = await Rider.findById(req.user.id);

    // Build filter query
    const filter = {
      status: "requested",
      riderId: null,
    };

    // Add gender filter - only show rides where no gender preference is set or rider matches preference
    filter.$or = [
      { preferredRiderGender: "no_preference" },
      { preferredRiderGender: rider.gender },
    ];

    const rides = await Ride.find(filter).populate(
      "userId",
      "name profilePicture rating"
    );

    res.status(200).json({
      success: true,
      count: rides.length,
      data: rides,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Accept a ride request (for riders)
// @route   PUT /api/rides/:id/accept
// @access  Private (Rider only)
exports.acceptRideRequest = async (req, res) => {
  try {
    let ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Check if ride is already accepted
    if (ride.status !== "requested") {
      return res.status(400).json({
        success: false,
        message: `Ride cannot be accepted as it is currently ${ride.status}`,
      });
    }

    // Update ride with rider info and status
    ride = await Ride.findByIdAndUpdate(
      req.params.id,
      {
        riderId: req.user.id,
        status: "accepted",
        acceptTime: Date.now(),
      },
      { new: true, runValidators: true }
    ).populate("riderId", "name profilePicture vehicleDetails");

    // Notify user that their ride has been accepted
    notificationService.notifyUser(
      ride.userId,
      "Ride Accepted",
      "Your ride request has been accepted",
      { rideId: ride._id.toString() }
    );

    res.status(200).json({
      success: true,
      data: ride,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update ride status
// @route   PUT /api/rides/:id/status
// @access  Private (Rider only)
exports.updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status transition
    const validStatusTransitions = {
      accepted: ["in-progress", "cancelled"],
      "in-progress": ["completed", "cancelled"],
    };

    let ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Check if rider is assigned to this ride
    if (ride.riderId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this ride",
      });
    }

    // Check if status transition is valid
    if (
      !validStatusTransitions[ride.status] ||
      !validStatusTransitions[ride.status].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${ride.status} to ${status}`,
      });
    }

    // Update additional time fields based on status
    const updateData = { status };

    if (status === "in-progress") {
      updateData.pickupTime = Date.now();
    } else if (status === "completed") {
      updateData.dropoffTime = Date.now();
    }

    // Update ride status
    ride = await Ride.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // Notify user about ride status update
    const statusMessages = {
      "in-progress": "Your ride has started",
      completed: "Your ride has been completed",
      cancelled: "Your ride has been cancelled",
    };

    notificationService.notifyUser(
      ride.userId,
      `Ride ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      statusMessages[status] ||
        `Your ride status has been updated to ${status}`,
      { rideId: ride._id.toString() }
    );

    res.status(200).json({
      success: true,
      data: ride,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get user's ride history
// @route   GET /api/rides/history
// @access  Private (User)
exports.getUserRideHistory = async (req, res) => {
  try {
    const rides = await Ride.find({ userId: req.user.id })
      .populate("riderId", "name profilePicture rating")
      .sort({ requestTime: -1 });

    res.status(200).json({
      success: true,
      count: rides.length,
      data: rides,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get rider's ride history
// @route   GET /api/rides/rider-history
// @access  Private (Rider)
exports.getRiderRideHistory = async (req, res) => {
  try {
    const rides = await Ride.find({ riderId: req.user.id })
      .populate("userId", "name profilePicture rating")
      .sort({ requestTime: -1 });

    res.status(200).json({
      success: true,
      count: rides.length,
      data: rides,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Rate and review completed ride
// @route   POST /api/rides/:id/rate
// @access  Private (User and Rider)
exports.rateRide = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // Check if ride is completed
    if (ride.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only rate completed rides",
      });
    }

    // Determine if user or rider is rating
    const updateData = {};

    if (req.userType === "user" && ride.userId.toString() === req.user.id) {
      // User rating rider
      updateData.riderRating = rating;
      updateData.riderFeedback = feedback;

      // Update rider's overall rating
      const riderRides = await Ride.find({
        riderId: ride.riderId,
        riderRating: { $exists: true },
      });

      const totalRating =
        riderRides.reduce((sum, r) => sum + r.riderRating, 0) + rating;
      const averageRating = totalRating / (riderRides.length + 1);

      await Rider.findByIdAndUpdate(ride.riderId, { rating: averageRating });
    } else if (
      req.userType === "rider" &&
      ride.riderId.toString() === req.user.id
    ) {
      // Rider rating user
      updateData.userRating = rating;
      updateData.userFeedback = feedback;

      // Update user's overall rating
      const userRides = await Ride.find({
        userId: ride.userId,
        userRating: { $exists: true },
      });

      const totalRating =
        userRides.reduce((sum, r) => sum + r.userRating, 0) + rating;
      const averageRating = totalRating / (userRides.length + 1);

      await User.findByIdAndUpdate(ride.userId, { rating: averageRating });
    } else {
      return res.status(403).json({
        success: false,
        message: "Not authorized to rate this ride",
      });
    }

    // Update ride with rating data
    const updatedRide = await Ride.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedRide,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get ride statistics
// @route   GET /api/admin/rides/stats
// @access  Private/Admin
exports.getRideStats = async (req, res) => {
  try {
    const { period } = req.query;
    const dateRange = getDateRange(period);

    // Aggregate pipeline for ride statistics
    const stats = await Ride.aggregate([
      {
        $match: {
          createdAt: {
            $gte: dateRange.start,
            $lte: dateRange.end,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          revenue: { $sum: "$fare.total" },
          totalDistance: { $sum: "$route.distance" },
          totalDuration: { $sum: "$route.duration" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          completed: 1,
          cancelled: 1,
          active: 1,
          revenue: 1,
          avgDistance: {
            $round: [
              { $divide: ["$totalDistance", { $max: ["$total", 1] }] },
              2,
            ],
          },
          avgDuration: {
            $round: [
              { $divide: ["$totalDuration", { $max: ["$total", 1] }] },
              2,
            ],
          },
          avgFare: {
            $round: [{ $divide: ["$revenue", { $max: ["$total", 1] }] }, 2],
          },
        },
      },
    ]);

    // Return default values if no stats found
    const defaultStats = {
      total: 0,
      completed: 0,
      cancelled: 0,
      active: 0,
      revenue: 0,
      avgDistance: 0,
      avgDuration: 0,
      avgFare: 0,
    };

    res.json({
      success: true,
      data: stats.length > 0 ? stats[0] : defaultStats,
    });
  } catch (error) {
    console.error("Error in getRideStats:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
