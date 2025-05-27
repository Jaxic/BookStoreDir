/** @jsxImportSource react */
import { useEffect, useState, useMemo, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ProcessedBookstore } from '../../types/bookstore';

interface StoreMapGLProps {
  stores: ProcessedBookstore[];
  height?: string;
  className?: string;
}

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

export default function StoreMapGL({ 
  stores, 
  height = "100%",
  className = ""
}: StoreMapGLProps) {
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [selectedStore, setSelectedStore] = useState<ProcessedBookstore | null>(null);
  const [popupInfo, setPopupInfo] = useState<{store: ProcessedBookstore, latitude: number, longitude: number} | null>(null);

  // Initial view state - centered on Canada
  const [viewState, setViewState] = useState({
    longitude: -106.3468,
    latitude: 56.1304,
    zoom: 4
  });

  // Filter and process stores
  const validStores = useMemo(() => {
    console.log(`StoreMapGL displaying ${stores.length} stores`);
    return stores.filter(store => {
      const lat = parseFloat(store.lat);
      const lng = parseFloat(store.lng);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });
  }, [stores]);

  // Get user's location
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      console.warn('Geolocation not supported');
      setLocationError('Geolocation not supported');
      setIsLoadingLocation(false);
      return;
    }

    console.log('Attempting to get user location...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(userPos);
        setIsLoadingLocation(false);
        
        // Center map on user location
        setViewState(prev => ({
          ...prev,
          longitude: userPos.longitude,
          latitude: userPos.latitude,
          zoom: 11
        }));
        
        console.log(`✅ Successfully got user location: ${userPos.latitude}, ${userPos.longitude}`);
      },
      (error) => {
        console.error('❌ Error getting location:', error);
        setLocationError(`Location access denied: ${error.message}`);
        setIsLoadingLocation(false);
      },
      { 
        timeout: 15000, 
        enableHighAccuracy: false,
        maximumAge: 300000 
      }
    );
  }, []);

  // Handle marker click
  const onMarkerClick = useCallback((store: ProcessedBookstore) => {
    const lat = parseFloat(store.lat);
    const lng = parseFloat(store.lng);
    
    setPopupInfo({
      store,
      latitude: lat,
      longitude: lng
    });
  }, []);

  // Close popup
  const onPopupClose = useCallback(() => {
    setPopupInfo(null);
  }, []);

  // Calculate distance for display
  const getDistanceText = useCallback((store: ProcessedBookstore) => {
    if (!userLocation) return null;
    
    const lat = parseFloat(store.lat);
    const lng = parseFloat(store.lng);
    const distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lng);
    
    return `${distance.toFixed(1)}km away`;
  }, [userLocation]);

  // Fit map to show all stores
  const fitToStores = useCallback(() => {
    if (validStores.length === 0) return;
    
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    
    validStores.forEach(store => {
      const lat = parseFloat(store.lat);
      const lng = parseFloat(store.lng);
      
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    });
    
    // Add user location to bounds if available
    if (userLocation) {
      minLat = Math.min(minLat, userLocation.latitude);
      maxLat = Math.max(maxLat, userLocation.latitude);
      minLng = Math.min(minLng, userLocation.longitude);
      maxLng = Math.max(maxLng, userLocation.longitude);
    }
    
    // Calculate center and zoom
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Simple zoom calculation based on bounds
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 10;
    if (maxDiff > 50) zoom = 4;
    else if (maxDiff > 20) zoom = 6;
    else if (maxDiff > 10) zoom = 7;
    else if (maxDiff > 5) zoom = 8;
    else if (maxDiff > 2) zoom = 9;
    
    setViewState({
      longitude: centerLng,
      latitude: centerLat,
      zoom: zoom
    });
  }, [validStores, userLocation]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map container */}
      <div className="w-full h-full" style={{ minHeight: '400px' }}>
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ width: '100%', height: '100%' }}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker
              longitude={userLocation.longitude}
              latitude={userLocation.latitude}
              anchor="center"
            >
              <div className="user-location-marker">
                <div className="user-marker-pulse"></div>
                <div className="user-marker-dot">📍</div>
              </div>
            </Marker>
          )}

          {/* Store markers */}
          {validStores.map((store, index) => {
            const lat = parseFloat(store.lat);
            const lng = parseFloat(store.lng);
            
            return (
              <Marker
                key={`${store.name}-${index}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
              >
                <button
                  className="store-marker-button"
                  onClick={() => onMarkerClick(store)}
                  title={store.name}
                >
                  <div className="store-marker">
                    <span className="marker-icon">📚</span>
                  </div>
                </button>
              </Marker>
            );
          })}

          {/* Popup */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              anchor="bottom"
              onClose={onPopupClose}
              closeButton={true}
              closeOnClick={false}
            >
              <div className="store-popup">
                <h3 className="font-bold text-lg mb-2">{popupInfo.store.name}</h3>
                <p className="text-gray-600 mb-1">{popupInfo.store.address}</p>
                <p className="text-gray-600 mb-2">{popupInfo.store.city}, {popupInfo.store.province}</p>
                
                {getDistanceText(popupInfo.store) && (
                  <p className="text-sm mb-1 text-blue-600">📍 {getDistanceText(popupInfo.store)}</p>
                )}
                
                {popupInfo.store.phone && (
                  <p className="text-sm mb-1">📞 {popupInfo.store.phone}</p>
                )}
                
                {popupInfo.store.website && (
                  <p className="text-sm mb-1">
                    <a 
                      href={popupInfo.store.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      🌐 Website
                    </a>
                  </p>
                )}
                
                {popupInfo.store.ratingInfo && (
                  <p className="text-sm">
                    ⭐ {popupInfo.store.ratingInfo.rating}/5 ({popupInfo.store.ratingInfo.numReviews} reviews)
                  </p>
                )}
              </div>
            </Popup>
          )}
        </Map>
      </div>

      {/* Loading indicator */}
      {isLoadingLocation && (
        <div className="absolute top-4 left-4 bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm">Getting your location...</span>
          </div>
        </div>
      )}

      {/* Location error message */}
      {locationError && (
        <div className="absolute top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg shadow-lg max-w-sm">
          <p className="text-sm">
            <strong>Location unavailable:</strong> {locationError}
          </p>
          <p className="text-xs mt-1">
            Map will show Canada-wide view
          </p>
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        {userLocation && (
          <button
            onClick={() => {
              setViewState(prev => ({
                ...prev,
                longitude: userLocation.longitude,
                latitude: userLocation.latitude,
                zoom: 12
              }));
            }}
            className="bg-white shadow-lg rounded px-3 py-2 text-sm hover:bg-gray-50 border"
          >
            📍 My Location
          </button>
        )}
        
        <button
          onClick={fitToStores}
          className="bg-white shadow-lg rounded px-3 py-2 text-sm hover:bg-gray-50 border"
        >
          🗺️ Fit to Stores
        </button>
        
        <div className="bg-white shadow-lg rounded px-3 py-2 text-sm border">
          <div className="font-medium">{validStores.length} stores</div>
          <div className="text-xs text-gray-500">on map</div>
        </div>
      </div>

      {/* Custom styles */}
      <style>{`
        /* User location marker styles */
        .user-location-marker {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .user-marker-pulse {
          position: absolute;
          width: 24px;
          height: 24px;
          background: #3b82f6;
          border-radius: 50%;
          animation: pulse 2s infinite;
          opacity: 0.6;
        }
        
        .user-marker-dot {
          position: relative;
          width: 16px;
          height: 16px;
          background: #1d4ed8;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          z-index: 1;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.6;
          }
        }

        /* Store marker styles */
        .store-marker-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        
        .store-marker {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: white;
          border: 2px solid #2563eb;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        
        .store-marker:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .marker-icon {
          font-size: 16px;
        }

        /* Popup styles */
        .store-popup {
          font-family: system-ui, -apple-system, sans-serif;
          min-width: 250px;
          max-width: 300px;
        }
        
        /* MapLibre popup styling */
        .maplibregl-popup-content {
          border-radius: 8px;
          padding: 16px;
        }
        
        .maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
          border-top-color: white;
        }
      `}</style>
    </div>
  );
} 