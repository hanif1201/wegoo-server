// controllers/adminController.js
const User = require("../models/User");
const Rider = require("../models/Rider");
const Ride = require("../models/Ride");
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", { email }); // Don't log passwords

    if (!email || !password) {
      console.log("Missing credentials");
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    // Check for admin
    const admin = await User.findOne({ email, role: "admin" }).select(
      "+passwordHash"
    );
    console.log("Admin found:", admin ? "Yes" : "No");

    if (!admin) {
      console.log("Admin not found");
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);
    console.log("Password match:", isMatch ? "Yes" : "No");

    if (!isMatch) {
      console.log("Password mismatch");
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = admin.getSignedJwtToken();
    console.log("Login successful, token generated");

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Error logging in",
    });
  }
};

// @desc    Get current logged in admin
// @route   GET /api/admin/me
// @access  Private/Admin
exports.getMe = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    res.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      message: "Error getting admin profile",
    });
  }
};

// USER MANAGEMENT
// Get all users with pagination
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const searchRegex = new RegExp(search, "i");

    const query = {
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ],
    };

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
      currentPage: page,
      totalPages,
      totalItems: totalUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user details
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get additional user statistics
    const rides = await Ride.find({ userId: user._id });

    const userStats = {
      totalRides: rides.length,
      totalSpent: rides.reduce((sum, ride) => sum + ride.fare.total, 0),
    };

    res.status(200).json({
      success: true,
      data: { ...user.toObject(), ...userStats },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/user-stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
  try {
    console.log("Starting getUserStats...");

    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [{ $eq: ["$isActive", true] }, 1, 0],
            },
          },
          verifiedUsers: {
            $sum: {
              $cond: [{ $eq: ["$isVerified", true] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          activeUsers: 1,
          verifiedUsers: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
      },
    });
  } catch (error) {
    console.error("Error in getUserStats:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// RIDER MANAGEMENT
// Get all riders with pagination
exports.getRiders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const searchRegex = new RegExp(search, "i");

    const query = {
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { "vehicleDetails.licensePlate": searchRegex },
      ],
    };

    const totalRiders = await Rider.countDocuments(query);
    const totalPages = Math.ceil(totalRiders / limit);

    const riders = await Rider.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: riders,
      currentPage: page,
      totalPages,
      totalItems: totalRiders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get rider details
exports.getRiderById = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.riderId);

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Get additional rider statistics
    const rides = await Ride.find({ riderId: rider._id });

    const riderStats = {
      totalRides: rides.length,
      totalEarnings: rides.reduce((sum, ride) => sum + ride.fare.total, 0),
      completionRate:
        rides.length > 0
          ? (rides.filter((ride) => ride.status === "completed").length /
              rides.length) *
            100
          : 0,
      averageRating:
        rides.length > 0
          ? rides.reduce((sum, ride) => sum + (ride.riderRating || 0), 0) /
            rides.filter((ride) => ride.riderRating).length
          : 0,
    };

    res.status(200).json({
      success: true,
      data: { ...rider.toObject(), ...riderStats },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update rider status
exports.updateRiderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "suspended", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const rider = await Rider.findByIdAndUpdate(
      req.params.riderId,
      { verificationStatus: status },
      { new: true }
    );

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify rider document
exports.verifyRiderDocument = async (req, res) => {
  try {
    const { verificationStatus } = req.body;

    if (!["pending", "verified", "rejected"].includes(verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification status",
      });
    }

    const rider = await Rider.findById(req.params.riderId);

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Find the document and update its status
    const documentIndex = rider.documents.findIndex(
      (doc) => doc._id.toString() === req.params.documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    rider.documents[documentIndex].verificationStatus = verificationStatus;

    // Auto-approve rider if all documents are verified
    if (verificationStatus === "verified") {
      const allVerified = rider.documents.every(
        (doc) => doc.verificationStatus === "verified"
      );
      if (allVerified) {
        rider.verificationStatus = "approved";
      }
    }

    await rider.save();

    res.status(200).json({
      success: true,
      data: rider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get rider statistics
exports.getRiderStats = async (req, res) => {
  try {
    const totalRiders = await Rider.countDocuments();
    const activeRiders = await Rider.countDocuments({
      verificationStatus: "approved",
      isAvailable: true,
    });
    const pendingVerification = await Rider.countDocuments({
      verificationStatus: "pending",
    });

    // Calculate average ratings and earnings
    const rides = await Ride.find({ status: "completed" });

    const totalEarnings = rides.reduce((sum, ride) => sum + ride.fare.total, 0);

    // Get rider ratings
    const ridersWithRatings = await Rider.find({
      rating: { $exists: true, $ne: null },
    });
    const avgRating =
      ridersWithRatings.length > 0
        ? ridersWithRatings.reduce((sum, rider) => sum + rider.rating, 0) /
          ridersWithRatings.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRiders,
        activeRiders,
        pendingVerification,
        totalEarnings,
        avgRating,
        avgEarningsPerRider: totalRiders > 0 ? totalEarnings / totalRiders : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// RIDE MANAGEMENT
// Get all rides with pagination and filters
exports.getRides = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, dateFrom, dateTo } = req.query;

    const query = {};

    // Apply status filter
    if (status) {
      query.status = status;
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      query.requestTime = {};
      if (dateFrom) {
        query.requestTime.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.requestTime.$lte = new Date(dateTo);
      }
    }

    const totalRides = await Ride.countDocuments(query);
    const totalPages = Math.ceil(totalRides / limit);

    const rides = await Ride.find(query)
      .populate("userId", "name email phone")
      .populate("riderId", "name email phone vehicleDetails")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ requestTime: -1 });

    res.status(200).json({
      success: true,
      data: rides,
      currentPage: page,
      totalPages,
      totalItems: totalRides,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get ride details
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId)
      .populate("userId", "name email phone")
      .populate("riderId", "name email phone vehicleDetails");

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    res.status(200).json({
      success: true,
      data: ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update ride status (admin override)
exports.updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (
      ![
        "requested",
        "accepted",
        "in-progress",
        "completed",
        "cancelled",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      {
        status,
        ...(status === "cancelled" && { cancellationReason: "Admin override" }),
      },
      { new: true }
    )
      .populate("userId", "name email phone")
      .populate("riderId", "name email phone vehicleDetails");

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    res.status(200).json({
      success: true,
      data: ride,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get ride statistics
// @route   GET /api/admin/rides/stats
// @access  Private/Admin
exports.getRideStats = async (req, res) => {
  try {
    console.log("Starting getRideStats...");
    const { period } = req.query;
    console.log("Period:", period);

    // First, check if Ride model exists
    if (!Ride) {
      console.error("Ride model not found");
      return res.status(500).json({
        success: false,
        message: "Ride model not properly initialized",
      });
    }

    // Simple count first to verify database connection
    const rideCount = await Ride.countDocuments();
    console.log("Total rides found:", rideCount);

    // Use a longer date range to include your March data
    let dateFilter = {};
    if (period === "week") {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60); // Changed from 7 to 60 days
      dateFilter = {
        createdAt: { $gte: sixtyDaysAgo },
      };
    }

    console.log("Date filter:", dateFilter);

    // Using a simpler query approach to avoid issues
    const totalRides = await Ride.countDocuments(dateFilter);
    const completedRides = await Ride.countDocuments({
      ...dateFilter,
      status: "completed",
    });
    const cancelledRides = await Ride.countDocuments({
      ...dateFilter,
      status: "cancelled",
    });
    const activeRides = await Ride.countDocuments({
      ...dateFilter,
      status: { $in: ["requested", "accepted", "in-progress"] },
    });

    // Calculate revenue from completed rides
    const completedRidesData = await Ride.find({
      ...dateFilter,
      status: "completed",
    });

    let totalRevenue = 0;
    let totalDistance = 0;
    let totalDuration = 0;

    // Log the first completed ride to see its structure
    if (completedRidesData.length > 0) {
      console.log(
        "Sample completed ride:",
        JSON.stringify(completedRidesData[0].fare, null, 2)
      );
    }

    completedRidesData.forEach((ride) => {
      // Check for fare.total
      if (ride.fare && typeof ride.fare.total === "number") {
        totalRevenue += ride.fare.total;
      }
      // If fare is just a number
      else if (typeof ride.fare === "number") {
        totalRevenue += ride.fare;
      }
      // Debug log when fare structure is unexpected
      else if (ride.fare) {
        console.log("Unknown fare structure:", typeof ride.fare, ride.fare);
      }

      // Extract distance
      if (ride.route && typeof ride.route.distance === "number") {
        totalDistance += ride.route.distance;
      }

      // Extract duration
      if (ride.route && typeof ride.route.duration === "number") {
        totalDuration += ride.route.duration;
      }
    });

    const avgDistance = completedRides > 0 ? totalDistance / completedRides : 0;
    const avgDuration = completedRides > 0 ? totalDuration / completedRides : 0;
    const avgFare = completedRides > 0 ? totalRevenue / completedRides : 0;

    const stats = {
      total: totalRides,
      completed: completedRides,
      cancelled: cancelledRides,
      active: activeRides,
      revenue: totalRevenue,
      totalDistance,
      avgDistance,
      avgDuration,
      avgFare,
    };

    console.log("Formatted stats:", stats);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Detailed error in getRideStats:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      success: false,
      message: "Error fetching ride statistics",
      error: error.message,
    });
  }
};

// Get dashboard overview stats
exports.getDashboardStats = async (req, res) => {
  try {
    // Count users, riders, and rides
    const totalUsers = await User.countDocuments();
    const totalRiders = await Rider.countDocuments();
    const totalRides = await Ride.countDocuments();

    // New users and riders today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today },
    });

    const newRidersToday = await Rider.countDocuments({
      createdAt: { $gte: today },
    });

    // Rides today
    const ridesToday = await Ride.countDocuments({
      requestTime: { $gte: today },
    });

    // Revenue today
    const todayRides = await Ride.find({
      status: "completed",
      dropoffTime: { $gte: today },
    });

    const revenueToday = todayRides.reduce(
      (sum, ride) => sum + ride.fare.total,
      0
    );

    // Active riders now
    const activeRiders = await Rider.countDocuments({
      isAvailable: true,
    });

    // Get last 7 days revenue data
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const revenueData = await Ride.aggregate([
      {
        $match: {
          status: "completed",
          dropoffTime: { $gte: last7Days },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$dropoffTime" } },
          revenue: { $sum: "$fare.total" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format for chart
    const chartData = revenueData.map((day) => ({
      date: day._id,
      revenue: day.revenue,
      rides: day.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRiders,
        totalRides,
        newUsersToday,
        newRidersToday,
        ridesToday,
        revenueToday,
        activeRiders,
        chartData,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
