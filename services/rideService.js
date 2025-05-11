// services/rideService.js

// Helper function to calculate distance between two points (haversine formula)
exports.calculateDistance = (pickup, dropoff) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(dropoff.latitude - pickup.latitude);
  const dLon = deg2rad(dropoff.longitude - pickup.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(pickup.latitude)) *
      Math.cos(deg2rad(dropoff.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Helper to convert degrees to radians
const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Calculate estimated ride duration in minutes based on distance
exports.calculateDuration = (distance) => {
  // Assuming average speed of 30 km/h in city
  const speedKmPerHour = 30;
  const durationHours = distance / speedKmPerHour;
  return Math.round(durationHours * 60); // Convert to minutes
};

// Calculate fare based on distance and duration
exports.calculateFare = (distance, duration) => {
  // Example fare calculation
  const baseFare = 2.5;
  const perKmRate = 1.5;
  const perMinuteRate = 0.3;

  const distanceCost = distance * perKmRate;
  const durationCost = duration * perMinuteRate;
  const totalFare = baseFare + distanceCost + durationCost;

  return {
    baseFare,
    distance: parseFloat(distanceCost.toFixed(2)),
    duration: parseFloat(durationCost.toFixed(2)),
    total: parseFloat(totalFare.toFixed(2)),
  };
};

// Estimate fare for a ride request
exports.estimateFare = (pickup, dropoff) => {
  const distance = this.calculateDistance(pickup, dropoff);
  const duration = this.calculateDuration(distance);
  return this.calculateFare(distance, duration);
};
