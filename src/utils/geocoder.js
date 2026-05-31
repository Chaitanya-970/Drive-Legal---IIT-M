import * as turf from '@turf/turf';
import jurisdictions from './jurisdictions.json';


export async function resolveJurisdiction(lat, lng) {
  try {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error("Invalid coordinates provided");
    }

    
    const pt = turf.point([lng, lat]);

    
    for (const feature of jurisdictions.features) {
      if (turf.booleanPointInPolygon(pt, feature.geometry)) {
        return {
          regionId: feature.properties.regionId,
          country: feature.properties.country,
          region: feature.properties.region
        };
      }
    }
    
    
    if (navigator.onLine) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await response.json();
        if (data && data.address && data.address.state) {
          return {
            regionId: "ONLINE_DETECTED",
            country: data.address.country || "India",
            region: data.address.state
          };
        }
      } catch (err) {
        console.warn("Online geocoding fallback failed:", err);
      }
    }

    return {
      regionId: "STANDARD_FEDERAL",
      country: "India", 
      region: "National/Default"
    };

  } catch (error) {
    console.error("Geocoding failed:", error);
    
    return {
      regionId: "STANDARD_FEDERAL",
      country: "India",
      region: "National/Default"
    };
  }
}
