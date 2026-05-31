const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  zoneType: {
    type: String,
    enum: ['School Zone', 'Hospital Zone', 'Construction Zone', 'General'],
    required: true
  },
  multiplier: {
    type: Number,
    required: true,
    default: 1.0
  },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], 
      required: true
    }
  }
}, { timestamps: true });


geofenceSchema.index({ geometry: '2dsphere' });

module.exports = mongoose.model('Geofence', geofenceSchema);
