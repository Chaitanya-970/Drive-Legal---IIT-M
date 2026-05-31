const Geofence = require('../models/Geofence');
const Driver = require('../models/Driver');

const BASE_FINES = {
  'Speeding': 500,
  'Red Light': 1000,
  'Reckless Driving': 2000
};


async function calculatePenalty(violationName, lat, lng, licenseNumber) {
  
  const baseFine = BASE_FINES[violationName] || 100; 

  
  let zoneMultiplier = 1.0;
  let activeZone = null;
  
  if (lat != null && lng != null) {
    
    
    const geofence = await Geofence.findOne({
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          }
        }
      }
    });

    if (geofence) {
      zoneMultiplier = geofence.multiplier;
      activeZone = geofence.zoneType;
    }
  }

  
  let historyMultiplier = 1.0;
  let driverProfile = null;
  
  if (licenseNumber) {
    driverProfile = await Driver.findOne({ licenseNumber });
    if (driverProfile) {
      const pastOffenses = (driverProfile.penaltyPoints || 0) + (driverProfile.unresolvedOffenses || 0);
      
      historyMultiplier = Math.pow(1.10, pastOffenses);
    }
  }

  
  const totalFine = Math.round(baseFine * zoneMultiplier * historyMultiplier);

  return {
    baseFine,
    zoneMultiplier,
    activeZone,
    historyMultiplier,
    driverProfile: driverProfile ? {
      penaltyPoints: driverProfile.penaltyPoints,
      unresolvedOffenses: driverProfile.unresolvedOffenses
    } : null,
    totalFine
  };
}

module.exports = {
  BASE_FINES,
  calculatePenalty
};
