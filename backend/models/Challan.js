const mongoose = require('mongoose');

const challanSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: ['Two-Wheeler', 'Four-Wheeler'],
    },
    violationCode: {
      type: String,
      required: [true, 'Violation code is required'],
      trim: true,
    },
    violationName: {
      type: String,
      trim: true,
    },
    fineAmount: {
      type: Number,
      required: [true, 'Fine amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    isAiDetected: {
      type: Boolean,
      default: false,
    },
    isRepeatOffense: {
      type: Boolean,
      default: false,
    },
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model('Challan', challanSchema);
