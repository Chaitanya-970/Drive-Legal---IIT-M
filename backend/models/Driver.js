const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  penaltyPoints: {
    type: Number,
    default: 0
  },
  unresolvedOffenses: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
