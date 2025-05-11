// controllers/authController.js
const User = require("../models/User");
const Rider = require("../models/Rider");

// @desc    Register user
// @route   POST /api/auth/user/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: password,
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Register rider
// @route   POST /api/auth/rider/register
// @access  Public
exports.registerRider = async (req, res) => {
  try {
    const { name, email, phone, password, vehicleDetails } = req.body;

    // Create rider
    const rider = await Rider.create({
      name,
      email,
      phone,
      passwordHash: password,
      vehicleDetails,
    });

    sendTokenResponse(rider, 201, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/user/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Login rider
// @route   POST /api/auth/rider/login
// @access  Public
exports.loginRider = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email and password",
      });
    }

    // Check for rider
    const rider = await Rider.findOne({ email }).select("+passwordHash");

    if (!rider) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await rider.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendTokenResponse(rider, 200, res);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};
