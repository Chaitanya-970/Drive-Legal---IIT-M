const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { calculatePenalty } = require('../utils/penaltyMatrix');
const Geofence = require('../models/Geofence');
const Driver = require('../models/Driver');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  
  await Geofence.create({
    zoneType: 'School Zone',
    multiplier: 2.0,
    geometry: {
      type: 'Polygon',
      
      coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]]
    }
  });

  
  await Driver.create({
    licenseNumber: 'DL-123',
    penaltyPoints: 2,
    unresolvedOffenses: 1
  });
  
  
  await Geofence.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Dynamic Penalty Matrix Engine', () => {
  it('Standard Case: No active geofences, clean driver history', async () => {
    const result = await calculatePenalty('Speeding', 20, 20, 'CLEAN-999');
    
    expect(result.baseFine).toBe(500);
    expect(result.zoneMultiplier).toBe(1.0);
    expect(result.historyMultiplier).toBe(1.0);
    expect(result.totalFine).toBe(500);
  });

  it('Spatial Case: Violation strictly inside a School Zone (2.0x)', async () => {
    
    const result = await calculatePenalty('Red Light', 5, 5, 'CLEAN-999');
    
    expect(result.baseFine).toBe(1000);
    expect(result.zoneMultiplier).toBe(2.0);
    expect(result.activeZone).toBe('School Zone');
    expect(result.totalFine).toBe(2000);
  });

  it('Compounding History Case: Driver with 3 unresolved offenses (1.10^3)', async () => {
    const result = await calculatePenalty('Reckless Driving', 20, 20, 'DL-123');
    
    
    
    
    expect(result.baseFine).toBe(2000);
    expect(result.historyMultiplier).toBeCloseTo(1.331);
    expect(result.totalFine).toBe(2662);
  });

  it('Combined Case: School Zone + Bad Driver', async () => {
    const result = await calculatePenalty('Speeding', 5, 5, 'DL-123');
    
    
    
    
    expect(result.baseFine).toBe(500);
    expect(result.zoneMultiplier).toBe(2.0);
    expect(result.historyMultiplier).toBeCloseTo(1.331);
    expect(result.totalFine).toBe(1331);
  });

  it('Edge Case: Missing/unknown violation defaults to fallback 100', async () => {
    const result = await calculatePenalty('Unknown', 20, 20, 'CLEAN-999');
    expect(result.baseFine).toBe(100);
    expect(result.totalFine).toBe(100);
  });
});
