// services/notificationService.js
const User = require("../models/User");
const Rider = require("../models/Rider");

// This is a placeholder for actual push notification implementation
// In a real app, you would integrate with Firebase Cloud Messaging or another service
const sendPushNotification = async (token, title, body, data) => {
  console.log(`Sending push notification: ${title} - ${body}`);
  // This would be where you call your push notification service
  // e.g., firebase.messaging().send({...})
};

// Send notification to user
exports.notifyUser = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId);

    if (user) {
      // In a real app, you would get the user's FCM token from the database
      const fcmToken = user.fcmToken || "placeholder-token";
      await sendPushNotification(fcmToken, title, body, data);
    }
  } catch (error) {
    console.error("Error sending user notification:", error);
  }
};

// Send notification to rider
exports.notifyRider = async (riderId, title, body, data = {}) => {
  try {
    const rider = await Rider.findById(riderId);

    if (rider) {
      // In a real app, you would get the rider's FCM token from the database
      const fcmToken = rider.fcmToken || "placeholder-token";
      await sendPushNotification(fcmToken, title, body, data);
    }
  } catch (error) {
    console.error("Error sending rider notification:", error);
  }
};

// Notify nearby riders about a new ride request
exports.notifyNearbyRiders = async (rideRequest) => {
  try {
    // In a real app, you would filter riders by location and gender preference
    const genderFilter = {};

    // Only add gender filter if user has a preference
    if (rideRequest.preferredRiderGender !== "no_preference") {
      genderFilter.gender = rideRequest.preferredRiderGender;
    }

    // In a real app, you would query for riders near the pickup location with the gender filter
    // For example:
    /*
    const nearbyRiders = await Rider.find({
      isAvailable: true,
      ...genderFilter,
      'currentLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [
              rideRequest.pickupLocation.coordinates.longitude,
              rideRequest.pickupLocation.coordinates.latitude
            ]
          },
          $maxDistance: 5000 // 5km radius
        }
      }
    });
    */

    console.log(
      `Notifying nearby ${
        rideRequest.preferredRiderGender !== "no_preference"
          ? rideRequest.preferredRiderGender
          : ""
      } riders about ride request ${rideRequest._id}`
    );

    // In a real app, you would loop through nearby riders and send each a notification
    // nearbyRiders.forEach(rider => {
    //   this.notifyRider(
    //     rider._id,
    //     'New Ride Request',
    //     `New ride request ${rideRequest.pickupLocation.address}`,
    //     { rideId: rideRequest._id }
    //   );
    // });
  } catch (error) {
    console.error("Error notifying nearby riders:", error);
  }
};
