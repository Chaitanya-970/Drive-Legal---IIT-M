require('dotenv').config();


const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const Challan = require('./models/Challan');
const authRoutes = require('./routes/auth');
const { protect } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;




app.use(cors());
app.use(express.json());
app.use(cookieParser());




let isMongoConnected = false;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    isMongoConnected = true;
  })
  .catch((err) => {
    console.warn('⚠️ MongoDB connection failed. Server will continue running in offline/degraded mode.', err.message);
  });


const mockChallans = [];





app.use('/api/auth', authRoutes);
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);
const penaltyRoutes = require('./routes/penalty');
app.use('/api/penalty', penaltyRoutes);


app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.post('/api/challans', protect, async (req, res) => {
  if (!isMongoConnected) {
    const challan = { ...req.body, _id: Date.now().toString() };
    mockChallans.push(challan);
    return res.status(201).json({ success: true, data: challan, mock: true });
  }
  
  try {
    const challan = new Challan(req.body);
    const saved = await challan.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, errors: messages });
    }
    console.error('POST /api/challans error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


app.post('/api/challans/batch', protect, async (req, res) => {
  try {
    const { challans } = req.body;
    if (!Array.isArray(challans) || challans.length === 0) {
      return res.status(400).json({ success: false, error: 'challans array is required' });
    }

    if (!isMongoConnected) {
      const saved = challans.map(c => ({ ...c, _id: Date.now().toString() + Math.random().toString() }));
      mockChallans.push(...saved);
      return res.status(201).json({ success: true, count: saved.length, data: saved, mock: true });
    }

    const saved = await Challan.insertMany(challans, { ordered: false });
    res.status(201).json({ success: true, count: saved.length, data: saved });
  } catch (err) {
    console.error('POST /api/challans/batch error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


app.get('/api/challans', async (req, res) => {
  try {
    const filter = {};
    if (req.query.country) filter.country = req.query.country;
    if (req.query.vehicleType) filter.vehicleType = req.query.vehicleType;

    if (!isMongoConnected) {
      const filtered = mockChallans.filter(c => {
        let match = true;
        if (filter.country && c.country !== filter.country) match = false;
        if (filter.vehicleType && c.vehicleType !== filter.vehicleType) match = false;
        return match;
      });
      return res.json({ success: true, count: filtered.length, data: filtered, mock: true });
    }

    const challans = await Challan.find(filter).sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, count: challans.length, data: challans });
  } catch (err) {
    console.error('GET /api/challans error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


app.get('/api/fines/check', async (req, res) => {
  const { registration } = req.query;

  if (!registration) {
    return res.status(400).json({ success: false, error: 'Registration number is required in query params' });
  }

  const generateMockData = async (reg) => {
    await new Promise((resolve) => setTimeout(resolve, 800)); 
    
    
    const isClean = reg.length % 2 !== 0;
    
    if (isClean) {
      return {
        success: true,
        live: false,
        data: { StatusCode: 1, StatusMessage: 'No Pending Fines', ChallanDetails: [] }
      };
    }

    const offenses = [
      { details: 'Dangerous / Rash Riding (Sec 184 MVA)', amount: '1000' },
      { details: 'Riding without Helmet (Sec 129 / 194D MVA)', amount: '1000' },
      { details: 'Triple Riding (Overloading) (Sec 128 / 194C MVA)', amount: '1000' },
      { details: 'Driving without Seat Belt (Sec 194B(1) MVA)', amount: '1000' },
      { details: 'Overspeeding (Light Motor Vehicle) (Sec 183(1) MVA)', amount: '2000' },
      { details: 'Red Light Jump (Sec 119 / 177 MVA)', amount: '1000' },
      { details: 'Using Mobile Phone while Driving (Sec 184(c) MVA)', amount: '5000' },
      { details: 'Driving without Valid Insurance (Sec 196 MVA)', amount: '2000' },
      { details: 'Wrong-way Driving (Sec 177A MVA)', amount: '5000' },
      { details: 'Excessive Pollution / PUC Violation (Sec 190(2) MVA)', amount: '10000' }
    ];

    const locations = [
      'Anna Salai Intersection, Chennai',
      'MG Road, Bengaluru',
      'Connaught Place Inner Circle, Delhi',
      'Bandra-Worli Sea Link, Mumbai',
      'Electronic City Flyover, Bengaluru',
      'Rajiv Chowk, Delhi',
      'Marine Drive, Mumbai',
      'IT Corridor, OMR, Chennai'
    ];
    
    const randomOffense1 = offenses[Math.floor(Math.random() * offenses.length)];
    const randomOffense2 = offenses[Math.floor(Math.random() * offenses.length)];
    const randomLocation1 = locations[Math.floor(Math.random() * locations.length)];
    const randomLocation2 = locations[Math.floor(Math.random() * locations.length)];
    
    
    const pastDate1 = new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000);
    const pastDate2 = new Date(pastDate1.getTime() - Math.floor(Math.random() * 30) * 86400000);

    return {
      success: true,
      live: false,
      data: {
        StatusCode: 0,
        StatusMessage: 'Success',
        ChallanDetails: [
          { ChallanNumber: `CHL-${Math.floor(Math.random() * 900000) + 100000}`, OffenseDate: pastDate1.toISOString().split('T')[0], OffenseTime: `${Math.floor(Math.random() * 12) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`, OffenseDetails: randomOffense1.details, FineAmount: randomOffense1.amount, Location: randomLocation1, Status: 'Pending' },
          { ChallanNumber: `CHL-${Math.floor(Math.random() * 900000) + 100000}`, OffenseDate: pastDate2.toISOString().split('T')[0], OffenseTime: `${Math.floor(Math.random() * 12) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`, OffenseDetails: randomOffense2.details, FineAmount: randomOffense2.amount, Location: randomLocation2, Status: 'Pending' }
        ]
      }
    };
  };

  const mock = await generateMockData(registration);
  return res.json(mock);
});




app.listen(PORT, () => {
  console.log(`🚀 DriveLegal API server running on http://localhost:${PORT}`);
});
