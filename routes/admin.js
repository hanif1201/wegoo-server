// routes/admin.js
const express = require("express");
const {
  login,
  getMe,
  getUsers,
  getUserById,
  updateUserStatus,
  getUserStats,
  getRiders,
  getRiderById,
  updateRiderStatus,
  verifyRiderDocument,
  getRiderStats,
  getRides,
  getRideById,
  updateRideStatus,
  getRideStats,
  getDashboardStats,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes (no auth required)
router.post("/login", login);

// Protected routes - require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

// Admin profile
router.get("/me", getMe);

// User management routes
router.get("/users/stats", getUserStats);
router.get("/users/:userId", getUserById);
router.get("/users", getUsers);

router.put("/users/:userId/status", updateUserStatus);

// Rider management routes
router.get("/riders", getRiders);
router.get("/riders/:riderId", getRiderById);
router.put("/riders/:riderId/status", updateRiderStatus);
router.put("/riders/:riderId/documents/:documentId", verifyRiderDocument);
router.get("/riders/stats", getRiderStats);

// Ride management routes
router.get("/rides/stats", getRideStats);
router.get("/rides/:rideId", getRideById);
router.get("/rides", getRides);

router.put("/rides/:rideId/status", updateRideStatus);

// Dashboard route
router.get("/dashboard", getDashboardStats);

module.exports = router;
