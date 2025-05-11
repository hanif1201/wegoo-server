// socket/index.js
const User = require("../models/User");
const Rider = require("../models/Rider");
const Ride = require("../models/Ride");

// Keep track of connected users and riders
const connectedUsers = new Map(); // userId -> socketId
const connectedRiders = new Map(); // riderId -> socketId

module.exports = (io, socket) => {
  // User authentication
  socket.on("userConnect", async ({ userId, token }) => {
    // In a real app, validate the token here
    console.log(`User connected: ${userId}`);

    // Store user connection
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;

    // Join user-specific room
    socket.join(`user-${userId}`);
  });

  // Rider authentication
  socket.on("riderConnect", async ({ riderId, token }) => {
    // In a real app, validate the token here
    console.log(`Rider connected: ${riderId}`);

    // Store rider connection
    connectedRiders.set(riderId, socket.id);
    socket.riderId = riderId;

    // Join rider-specific room
    socket.join(`rider-${riderId}`);
  });

  // User creates a ride request
  socket.on("createRideRequest", async (rideData) => {
    try {
      console.log("New ride request created");

      // Get rider's gender preference
      const preferredGender = rideData.preferredRiderGender || "no_preference";

      if (preferredGender === "no_preference") {
        // Broadcast to all available riders
        io.to("availableRiders").emit("newRideRequest", {
          ...rideData,
          userId: socket.userId,
        });
      } else {
        // Broadcast only to riders of the preferred gender
        // We would need to create rooms for riders based on gender
        io.to(`availableRiders-${preferredGender}`).emit("newRideRequest", {
          ...rideData,
          userId: socket.userId,
        });
      }
    } catch (error) {
      console.error("Error in createRideRequest:", error);
      socket.emit("errorMessage", { message: "Error creating ride request" });
    }
  });

  // Rider accepts a ride
  socket.on("acceptRide", async ({ rideId, riderId }) => {
    try {
      // Update the ride in the database (handled by your API)
      // This is just for socket notification

      // Get the ride details
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return socket.emit("errorMessage", { message: "Ride not found" });
      }

      // Notify the user that their ride was accepted
      const userSocketId = connectedUsers.get(ride.userId.toString());
      if (userSocketId) {
        io.to(userSocketId).emit("rideAccepted", {
          rideId,
          riderId,
          riderDetails: await Rider.findById(riderId).select(
            "name profilePicture vehicleDetails"
          ),
        });
      }

      // Notify other riders that this ride is no longer available
      socket.broadcast
        .to("availableRiders")
        .emit("rideUnavailable", { rideId });

      // Create a private room for this ride
      const rideRoom = `ride-${rideId}`;
      socket.join(rideRoom);

      // Add user to this ride room too (if they're connected)
      if (userSocketId) {
        io.sockets.sockets.get(userSocketId)?.join(rideRoom);
      }
    } catch (error) {
      console.error("Error in acceptRide:", error);
      socket.emit("errorMessage", { message: "Error accepting ride" });
    }
  });

  // Location updates
  socket.on("updateLocation", async ({ type, id, coordinates }) => {
    try {
      if (type === "rider") {
        // Update rider location in database
        await Rider.findByIdAndUpdate(id, {
          "currentLocation.coordinates": coordinates,
          "currentLocation.lastUpdated": Date.now(),
        });

        // Broadcast to all active rides for this rider
        const activeRides = await Ride.find({
          riderId: id,
          status: { $in: ["accepted", "in-progress"] },
        });

        activeRides.forEach((ride) => {
          io.to(`ride-${ride._id}`).emit("riderLocation", {
            rideId: ride._id,
            coordinates,
          });
        });
      }
    } catch (error) {
      console.error("Error in updateLocation:", error);
    }
  });

  // Ride status updates
  socket.on("updateRideStatus", async ({ rideId, status, location }) => {
    try {
      // Broadcast to the ride room
      io.to(`ride-${rideId}`).emit("rideStatusUpdated", {
        rideId,
        status,
        location,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error in updateRideStatus:", error);
      socket.emit("errorMessage", { message: "Error updating ride status" });
    }
  });

  // Rider availability toggle
  socket.on("toggleAvailability", async ({ riderId, isAvailable }) => {
    try {
      // Get rider data including gender
      const rider = await Rider.findById(riderId);

      // Update rider availability in database
      await Rider.findByIdAndUpdate(riderId, { isAvailable });

      if (isAvailable) {
        // Join the general available riders room
        socket.join("availableRiders");

        // Also join gender-specific room for targeted broadcasts
        if (rider.gender) {
          socket.join(`availableRiders-${rider.gender}`);
        }

        console.log(`Rider ${riderId} is now available`);
      } else {
        // Leave the available riders rooms
        socket.leave("availableRiders");

        if (rider.gender) {
          socket.leave(`availableRiders-${rider.gender}`);
        }

        console.log(`Rider ${riderId} is now unavailable`);
      }
    } catch (error) {
      console.error("Error in toggleAvailability:", error);
      socket.emit("errorMessage", { message: "Error toggling availability" });
    }
  });

  // Chat messages
  socket.on("sendMessage", ({ rideId, sender, message }) => {
    io.to(`ride-${rideId}`).emit("newMessage", {
      rideId,
      sender,
      message,
      timestamp: Date.now(),
    });
  });

  // Clean up on disconnect
  socket.on("disconnect", () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }

    if (socket.riderId) {
      connectedRiders.delete(socket.riderId);
    }
  });
};
