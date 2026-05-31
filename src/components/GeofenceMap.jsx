import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './GeofenceMap.css';


window.type = '';

const CATEGORY_STYLES = {
  'School Zone': { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2, dashArray: '8, 8', weight: 2 },
  'Hospital Zone': { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, dashArray: '8, 8', weight: 2 },
  'High-Risk Corridor': { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, dashArray: '8, 8', weight: 2 },
  'General': { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, dashArray: '8, 8', weight: 2 }
};

export default function GeofenceMap({ center, validChallans, onZoneCreated, zones, setZones }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLayer, setPendingLayer] = useState(null);
  const [category, setCategory] = useState('High-Risk Corridor');
  const featureGroupRef = useRef(null);

  const _onCreated = (e) => {
    const { layerType, layer } = e;
    if (layerType === 'polygon' || layerType === 'rectangle') {
      
      if (featureGroupRef.current) {
        featureGroupRef.current.removeLayer(layer);
      }
      setPendingLayer(layer);
      setModalOpen(true);
    }
  };

  const handleSaveZone = () => {
    if (!pendingLayer) return;
    const geojson = pendingLayer.toGeoJSON();
    const newZone = {
      id: `ZONE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      category,
      geojson,
      createdAt: new Date().toISOString()
    };
    
    setZones((prev) => [...prev, newZone]);
    setModalOpen(false);
    setPendingLayer(null);
    setCategory('High-Risk Corridor');

    if (onZoneCreated) {
      onZoneCreated(newZone);
    }
  };

  const handleCancelZone = () => {
    setModalOpen(false);
    setPendingLayer(null);
  };

  return (
    <div className="geofence-map-wrapper">
      <MapContainer center={center} zoom={4} className="geofence-map-container" style={{ height: '100%', width: '100%', zIndex: 0 }}>
        
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={_onCreated}
            draw={{
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
              polygon: {
                allowIntersection: false,
                drawError: { color: '#ef4444', message: 'Intersection not allowed!' },
                shapeOptions: {
                  color: '#94a3b8',
                  dashArray: '5, 10',
                  fillOpacity: 0.1
                }
              },
              rectangle: {
                shapeOptions: {
                  color: '#94a3b8',
                  dashArray: '5, 10',
                  fillOpacity: 0.1
                }
              }
            }}
          />
        </FeatureGroup>

        
        {zones.map((zone) => (
          <GeoJSON 
            key={zone.id} 
            data={zone.geojson} 
            style={CATEGORY_STYLES[zone.category] || CATEGORY_STYLES['General']}
          >
            <Popup>
              <div className="geofence-popup">
                <strong>{zone.category}</strong>
                <span>ID: {zone.id}</span>
              </div>
            </Popup>
          </GeoJSON>
        ))}

        
        {validChallans && validChallans.map((challan) => {
          const radius = Math.min(Math.max(challan.fineAmount / 150, 6), 24);
          return (
            <CircleMarker 
              key={challan._id}
              center={[challan.lat, challan.lng]} 
              radius={radius}
              pathOptions={{ 
                color: '#FF6B35', 
                fillColor: '#FF6B35', 
                fillOpacity: 0.6,
                weight: 2
              }}
            >
              <Popup>
                <div style={{ margin: 0, padding: '0.25rem', color: '#0f172a' }}>
                  <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.35rem' }}>{challan.violationName || 'Traffic Violation'}</strong>
                  <span style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.1rem' }}><strong>Code:</strong> {challan.violationCode}</span>
                  <span style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.1rem' }}><strong>Vehicle:</strong> {challan.vehicleType}</span>
                  <strong style={{ display: 'block', marginTop: '0.5rem', color: '#ef4444', fontSize: '1.1rem' }}>{challan.currency} {challan.fineAmount}</strong>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      
      {modalOpen && (
        <div className="geofence-modal-overlay">
          <div className="geofence-modal">
            <h3 className="gf-modal-title">Categorize Zone</h3>
            <p className="gf-modal-desc">Assign a classification to the newly drawn geofence boundary.</p>
            
            <div className="gf-input-group">
              <label>Zone Type</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="gf-select">
                <option value="High-Risk Corridor">High-Risk Corridor</option>
                <option value="School Zone">School Zone</option>
                <option value="Hospital Zone">Hospital Zone</option>
                <option value="General">General Enforcement Area</option>
              </select>
            </div>

            <div className="gf-modal-actions">
              <button className="gf-btn-cancel" onClick={handleCancelZone}>Discard</button>
              <button className="gf-btn-save" onClick={handleSaveZone}>Save Zone</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
