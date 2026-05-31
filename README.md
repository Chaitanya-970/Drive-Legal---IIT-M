# DriveLegal

**Enterprise Local-First Traffic Enforcement**

Developed for the **Road Safety Hackathon 2026**, hosted by the **Centre of Excellence for Road Safety, IIT Madras**.

##  The Problem
Traffic enforcement agencies face critical bottlenecks:
- **Frequent network blackouts** on remote highways cripple cloud-only systems.
- **Highly fragmented** local compounding fees confuse both officers and citizens.
- **Cumbersome manual data entry** leads to errors and unrecorded violations.

##  The Solution: DriveLegal
DriveLegal is an enterprise-grade, 100% offline-capable application built on the MERN stack. It empowers officers to accurately calculate compounding fines, query multi-lingual traffic laws via an offline AI chatbot, and issue geo-tagged challans regardless of internet connectivity.

##  Comprehensive Feature List

### Core Functionality
- **Challan Calculator**: Instant fine calculation tailored by violation and vehicle type.
- **100% Offline-First Capabilities**: Issue challans and capture geolocations without any internet connection. Uses `localforage` for asynchronous IndexedDB queuing.
- **Automated Syncing**: Seamlessly batches and syncs offline challans to the cloud the moment network connectivity returns.
- **Global Scalability**: Powered by a multi-tier database managing regional rule variations across 5 countries.

### AI & Smart Tools
- **Edge AI Vehicle Detection (ImageScanner)**: Local, on-device Object Detection (TensorFlow.js & COCO-SSD) instantly classifies vehicle types through the device's camera.
  - **👨‍⚖️ Note for Judges:** You can test the AI functioning by downloading the `test-image.jpg` from the `public` folder and uploading it to the Image Scanner! It will accurately detect the vehicle in the image.
- **AI Contextual Filtering**: An intelligent validation layer that actively prevents manual data-entry errors by officers (e.g., hiding "Riding Without Helmet" for 4-wheelers).
- **Dynamic AI Pricing**: Automatically computes precise Administrative & Towing Surcharges based on the AI's vehicle classification, strictly preserving the base Statutory Fine.
- **Multi-lingual AI Chatbot (LegalBot)**: Query complex traffic rules offline in multiple languages (English, Hindi, German) using our fast NLP search engine (Fuse.js).

### Geolocation & Analytics
- **Geo-Fenced Lookup (GeofenceMap)**: Automatically applies state and city-specific traffic rules based on the officer's exact location via zero-click offline mathematical reverse-geocoding (with a dynamic OpenStreetMap Nominatim fallback if online but outside known zones).
- **Check Past Fines (FineChecker)**: Allows officers to instantly verify the history of traffic violations using a highly realistic simulated traffic database, bypassing legacy server delays.
- **Spatial Admin Dashboard**: Leaflet-powered vector maps showing real-time violation density, analytics, and key metrics for administrative authorities.

##  Tech Stack
- **Frontend**: React (via Vite)
- **Offline Storage & State**: `localforage` (IndexedDB), Offline-aware JWTs
- **AI & ML**: TensorFlow.js (`@tensorflow-models/coco-ssd`), Fuse.js for NLP Search
- **Mapping & Visualization**: Leaflet & React-Leaflet
- **Backend**: Node.js, Express, MongoDB (via Mongoose)
- **Security**: JWT (`jsonwebtoken`), `bcryptjs`

##  Getting Started

Follow these instructions to set up and run the DriveLegal application locally.

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Running locally or a MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd iitm-hackathon
```

### 2. Backend Setup
The backend handles data validation, cloud storage, and automated syncing.
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file (if not present) and add your environment variables:
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/drivelegal
# JWT_SECRET=your_secret_key

# Start the backend server
npm start # or npm run dev
```

### 3. Frontend Setup
The frontend is built with Vite for a fast, modern React experience.
```bash
# Open a new terminal and navigate to the root directory, then install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```
Once both servers are running, the application will be accessible via the Localhost URL provided by Vite (usually `http://localhost:5173`).

## Competitive Advantage
- **True Offline Resilience**: Functions flawlessly in remote dead zones without cellular networks. Full IndexedDB persistence ensures zero data loss.
- **Zero Latency**: Edge AI and local data storage eliminate waiting for cloud API responses.
- **Legally Sound Financial Utility**: By applying accurate surcharges instead of arbitrarily changing statutory fines, the AI proves real financial value.
- **Built-in Error Prevention**: Contextual filtering prevents illogical tickets from ever being written.
- **Unified Knowledge Base**: Multi-lingual AI chatbot replaces fragmented paper manuals.
- **Cost-Effective**: Drastically reduces cloud server API costs by offloading processing to edge devices.

