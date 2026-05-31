const { calculatePenalty } = require('../utils/penaltyMatrix');

exports.calculateDynamicPenalty = async (req, res) => {
  try {
    const { violationName, lat, lng, licenseNumber } = req.body;

    if (!violationName) {
      return res.status(400).json({ success: false, error: 'violationName is required' });
    }

    const result = await calculatePenalty(violationName, lat, lng, licenseNumber);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error calculating penalty:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
