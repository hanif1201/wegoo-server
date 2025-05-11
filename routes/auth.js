// routes/auth.js
const express = require("express");
const {
  registerUser,
  loginUser,
  registerRider,
  loginRider,
} = require("../controllers/authController");
const { login: adminLogin } = require("../controllers/adminController");

const router = express.Router();

// User routes
router.post("/user/register", registerUser);
router.post("/user/login", loginUser);

// Rider routes
router.post("/rider/register", registerRider);
router.post("/rider/login", loginRider);

// Admin routes
router.post("/admin/login", adminLogin);

module.exports = router;
