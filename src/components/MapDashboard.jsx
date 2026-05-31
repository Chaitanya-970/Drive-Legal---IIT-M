import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapDashboard.css';
import InsightsCard from './InsightsCard';

const MOCK_DENSITY_DATA = [
  { id: 1, lat: 28.6139, lng: 77.2090, violations: 45, severity: 'high' },
  { id: 2, lat: 28.6200, lng: 77.2100, violations: 12, severity: 'medium' },
  { id: 3, lat: 28.6100, lng: 77.2200, violations: 89, severity: 'high' },
  { id: 4, lat: 28.6300, lng: 77.2300, violations: 5, severity: 'low' },
  { id: 5, lat: 28.6050, lng: 77.1900, violations: 32, severity: 'medium' },
  { id: 6, lat: 28.6400, lng: 77.2000, violations: 110, severity: 'high' },
];

const SEVERITY_COLORS = {
  high: '#ef4444', 
  medium: '#f59e0b', 
  low: '#10b981', 
};

export default function MapDashboard({ center = [28.6139, 77.2090] }) {
  const totalViolations = MOCK_DENSITY_DATA.reduce((acc, curr) => acc + curr.violations, 0);
  const activeHotspots = MOCK_DENSITY_DATA.filter(d => d.severity === 'high').length;

  return (
    <div className="map-dashboard-container">
      <div className="md-map-section">
        <div className="md-map-header">
          <div>
            <h2 className="md-map-title">Spatial Admin Dashboard</h2>
            <p className="md-map-subtitle">Real-time violation density and monitoring</p>
          </div>
          <div className="md-map-stats">
            <div className="md-stat-item">
              <span className="md-stat-value">{totalViolations}</span>
              <span className="md-stat-label">Total Violations (24h)</span>
            </div>
            <div className="md-stat-item">
              <span className="md-stat-value" style={{ color: '#ef4444' }}>{activeHotspots}</span>
              <span className="md-stat-label">Active Hotspots</span>
            </div>
          </div>
        </div>

        <div className="md-map-wrapper">
          <MapContainer center={center} zoom={13} className="md-map-container" style={{ zIndex: 0 }}>
            
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {MOCK_DENSITY_DATA.map((point) => {
              const radius = Math.min(Math.max(point.violations / 5, 8), 35);
              return (
                <CircleMarker
                  key={point.id}
                  center={[point.lat, point.lng]}
                  radius={radius}
                  pathOptions={{
                    color: SEVERITY_COLORS[point.severity],
                    fillColor: SEVERITY_COLORS[point.severity],
                    fillOpacity: 0.5,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div style={{ color: '#0f172a', padding: '0.25rem' }}>
                      <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>Hotspot Activity</strong>
                      <span style={{ display: 'block', fontSize: '0.85rem' }}>Violations: <strong>{point.violations}</strong></span>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: SEVERITY_COLORS[point.severity], textTransform: 'capitalize', fontWeight: 'bold' }}>Severity: {point.severity}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <InsightsCard />
    </div>
  );
}
