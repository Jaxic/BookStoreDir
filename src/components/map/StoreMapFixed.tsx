/** @jsxImportSource react */
import { useEffect, useRef, useState, useMemo } from 'react';
import L, { Map, TileLayer, Marker, Icon, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ProcessedBookstore } from '../../types/bookstore';

interface StoreMapFixedProps {
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

export default function StoreMapFixed({ 
  stores, 
  height = "100%",
  className = ""
}: StoreMapFixedProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [targetStore, setTargetStore] = useState<ProcessedBookstore | null>(null);
  const hasTargetStoreRef = useRef(false); // Track if we have or expect a target store

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter and process stores
  const validStores = useMemo(() => {
    console.log(`StoreMapFixed displaying ${stores.length} stores`);
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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    try {
      console.log('🗺️ Initializing Leaflet map with mobile optimizations...');
      
      // Create map instance with mobile-optimized settings
      const map = new Map(mapContainer.current, {
        center: [56.1304, -106.3468], // Canada center - don't use userLocation here to avoid re-initialization
        zoom: 4,
        zoomControl: !isMobile, // Hide default zoom controls on mobile
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        boxZoom: false,
        keyboard: true,
        dragging: true,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 60
      });

      // Add tile layer
      const tileLayer = new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });
      
      tileLayer.addTo(map);

      // Create custom icons with mobile-optimized sizes
      const iconSize = isMobile ? 32 : 24;
      const userIconSize = isMobile ? 20 : 16;

      const storeIcon = new DivIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:#2563eb;width:${iconSize}px;height:${iconSize}px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:pointer;transition:transform 0.2s;' class='store-marker'><span style='font-size:${isMobile ? '16px' : '12px'};'>📚</span></div>`,
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize/2, iconSize/2]
      });

      // Store the user icon for later use
      (globalThis as any).userIcon = new DivIcon({
        className: 'user-location-icon',
        html: `<div style='background-color:#3b82f6;width:${userIconSize}px;height:${userIconSize}px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);animation:pulse 2s infinite;'></div>`,
        iconSize: [userIconSize, userIconSize],
        iconAnchor: [userIconSize/2, userIconSize/2]
      });

      // Add store markers
      validStores.forEach((store, index) => {
        const lat = parseFloat(store.lat);
        const lng = parseFloat(store.lng);
        
        const marker = new Marker([lat, lng], {
          icon: storeIcon
        });
        
        // Create mobile-optimized popup content
        let popupContent = `<div style="font-family:system-ui,sans-serif;min-width:${isMobile ? '250px' : '200px'};max-width:300px;">
          <h3 style="margin:0 0 8px 0;font-size:${isMobile ? '18px' : '16px'};font-weight:bold;line-height:1.2;">${store.name}</h3>
          <p style="margin:4px 0;color:#666;font-size:${isMobile ? '15px' : '14px'};">${store.address}</p>
          <p style="margin:4px 0;color:#666;font-size:${isMobile ? '15px' : '14px'};">${store.city}, ${store.province}</p>`;
        
        // Note: Distance calculation will be handled in separate effect when userLocation is available
        
        if (store.phone) {
          popupContent += `<p style="margin:4px 0;font-size:${isMobile ? '15px' : '14px'};"><a href="tel:${store.phone}" style="color:#2563eb;text-decoration:none;">📞 ${store.phone}</a></p>`;
        }
        
        if (store.website) {
          popupContent += `<p style="margin:4px 0;font-size:${isMobile ? '15px' : '14px'};"><a href="${store.website}" target="_blank" style="color:#2563eb;text-decoration:none;">🌐 Website</a></p>`;
        }
        
        if (store.ratingInfo) {
          popupContent += `<p style="margin:4px 0;font-size:${isMobile ? '15px' : '14px'};">⭐ ${store.ratingInfo.rating}/5 (${store.ratingInfo.numReviews} reviews)</p>`;
        }
        
        popupContent += `</div>`;
        
        marker.bindPopup(popupContent, {
          maxWidth: isMobile ? 300 : 250,
          closeButton: true,
          autoPan: true,
          autoPanPadding: [10, 10]
        });
        marker.addTo(map);
      });

      // Add mobile-specific event handlers
      if (isMobile) {
        // Hide controls when user starts interacting with map
        map.on('movestart zoomstart', () => {
          setShowControls(false);
        });

        // Show controls after interaction ends
        map.on('moveend zoomend', () => {
          setTimeout(() => setShowControls(true), 1000);
        });
      }

      mapInstance.current = map;
      setMapReady(true);
      
      console.log('✅ Leaflet map initialized successfully with mobile optimizations!');
      console.log(`📍 Added ${validStores.length} store markers`);

    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }

    // Cleanup function
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [validStores, isMobile]); // Removed userLocation from dependency array

  // Detect target store from URL parameters - MOVED AFTER map initialization
  useEffect(() => {
    // Only run after map is ready
    if (!mapReady) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const storeParam = urlParams.get('store');
    const cityParam = urlParams.get('city');
    const provinceParam = urlParams.get('province');
    
    console.log('🔍 CLIENT-SIDE TARGET STORE DETECTION (AFTER MAP READY):');
    console.log('- URL parameters:', { store: storeParam, city: cityParam, province: provinceParam });
    
    if (storeParam) {
      // Set the ref immediately to prevent bounds effect
      hasTargetStoreRef.current = true;
      
      // Decode the URL parameter
      const decodedStoreName = decodeURIComponent(storeParam);
      console.log(`- Looking for store: "${decodedStoreName}"`);
      
      // Try exact match with decoded name first (case-insensitive)
      let foundStore = stores.find(store => 
        store.name.toLowerCase() === decodedStoreName.toLowerCase()
      ) || null;
      
      if (!foundStore) {
        // Try exact match with original (in case it wasn't encoded) (case-insensitive)
        console.log(`- Trying with original name: "${storeParam}"`);
        foundStore = stores.find(store => 
          store.name.toLowerCase() === storeParam.toLowerCase()
        ) || null;
      }
      
      if (!foundStore) {
        // Try partial match (case-insensitive)
        console.log(`- Trying partial match...`);
        foundStore = stores.find(store => 
          store.name.toLowerCase().includes(decodedStoreName.toLowerCase()) ||
          decodedStoreName.toLowerCase().includes(store.name.toLowerCase())
        ) || null;
      }
      
      if (foundStore) {
        console.log(`✅ Found target store: "${foundStore.name}" at [${foundStore.lat}, ${foundStore.lng}]`);
        console.log(`🎯 CALLING setTargetStore with:`, foundStore);
        setTargetStore(foundStore);
        console.log(`🎯 setTargetStore called - targetStore should update`);
      } else {
        console.log(`❌ No store found matching: "${decodedStoreName}"`);
        console.log(`- Available stores (first 5):`, stores.slice(0, 5).map(s => s.name));
        hasTargetStoreRef.current = false; // Reset if no store found
      }
    } else if (cityParam && provinceParam) {
      // If city and province are specified, find stores in that area
      hasTargetStoreRef.current = true;
      const cityStores = stores.filter(store => 
        store.city.toLowerCase() === cityParam.toLowerCase() && 
        store.province.toLowerCase() === provinceParam.toLowerCase()
      );
      if (cityStores.length > 0) {
        const foundStore = cityStores[0]; // Use first store as focus point
        console.log(`✅ Found city/province target: "${foundStore.name}"`);
        setTargetStore(foundStore);
      } else {
        hasTargetStoreRef.current = false; // Reset if no store found
      }
    } else {
      // No target store parameters
      hasTargetStoreRef.current = false;
    }
  }, [stores, mapReady]); // Run when map becomes ready

  // Separate effect to handle user location marker
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;

    console.log('📍 Adding user location marker...');
    
    // Remove existing user location marker if any
    mapInstance.current.eachLayer((layer: any) => {
      if (layer.options && layer.options.className === 'user-location-marker') {
        mapInstance.current!.removeLayer(layer);
      }
    });

    // Add new user location marker
    const userMarker = new Marker([userLocation.latitude, userLocation.longitude], {
      icon: (globalThis as any).userIcon,
      className: 'user-location-marker'
    } as any);
    
    userMarker.addTo(mapInstance.current);
    userMarker.bindPopup("📍 Your Location");
    
    console.log(`✅ User location marker added at [${userLocation.latitude}, ${userLocation.longitude}]`);
  }, [userLocation, mapReady]);

  // Handle target store focusing - this is the main effect for zoom functionality
  useEffect(() => {
    const timestamp = Date.now();
    console.log(`🎯 [${timestamp}] TARGET STORE EFFECT - mapReady: ${mapReady}, targetStore:`, targetStore?.name || 'null');
    
    if (!mapInstance.current || !mapReady) {
      console.log(`❌ [${timestamp}] Map not ready - mapInstance: ${!!mapInstance.current}, mapReady: ${mapReady}`);
      return;
    }

    // Add a small delay to ensure map is fully rendered
    const timer = setTimeout(() => {
      if (targetStore) {
        const targetLat = parseFloat(targetStore.lat);
        const targetLng = parseFloat(targetStore.lng);
        
        console.log(`🎯 [${timestamp + 100}] Target store: ${targetStore.name}`);
        console.log(`🎯 [${timestamp + 100}] Coordinates: lat=${targetLat}, lng=${targetLng}`);
        
        if (!isNaN(targetLat) && !isNaN(targetLng)) {
          console.log(`🎯 [${timestamp + 100}] EXECUTING setView to [${targetLat}, ${targetLng}] with zoom 15`);
          
          // Use setView to focus on the target store - based on Context7 docs
          if (mapInstance.current) {
            mapInstance.current.setView([targetLat, targetLng], 15, {
              animate: true,
              duration: 1.5
            });
            
            console.log(`✅ [${timestamp + 100}] setView command executed`);
            
            // Verify the view was set correctly
            setTimeout(() => {
              if (mapInstance.current) {
                const center = mapInstance.current.getCenter();
                const zoom = mapInstance.current.getZoom();
                console.log(`📍 [${timestamp + 2100}] Verification - Current view: [${center.lat}, ${center.lng}] zoom: ${zoom}`);
              }
            }, 2000);
            
            // Find and open the popup for the target store
            setTimeout(() => {
              if (mapInstance.current) {
                console.log(`🔍 [${timestamp + 2600}] Looking for marker to open popup...`);
                mapInstance.current.eachLayer((layer: any) => {
                  if (layer instanceof L.Marker) {
                    const markerLatLng = layer.getLatLng();
                    const latDiff = Math.abs(markerLatLng.lat - targetLat);
                    const lngDiff = Math.abs(markerLatLng.lng - targetLng);
                    console.log(`📍 [${timestamp + 2600}] Checking marker at ${markerLatLng.lat}, ${markerLatLng.lng} - diff: lat=${latDiff}, lng=${lngDiff}`);
                    if (latDiff < 0.0001 && lngDiff < 0.0001) {
                      console.log(`✅ [${timestamp + 2600}] Found matching marker, opening popup`);
                      layer.openPopup();
                    }
                  }
                });
              }
            }, 2500);
          }
          
          return; // Exit early when we have a target store - DON'T run fitBounds
        } else {
          console.log(`❌ [${timestamp + 100}] Invalid coordinates: lat=${targetLat}, lng=${targetLng}`);
        }
      } else {
        console.log(`ℹ️ [${timestamp + 100}] No target store in target effect`);
      }
    }, 50); // Reduced delay to run before bounds effect

    return () => clearTimeout(timer);
  }, [mapReady, targetStore]); // Only depend on mapReady and targetStore

  // Separate effect for fitting bounds when NO target store is specified
  useEffect(() => {
    const timestamp = Date.now();
    console.log(`🗺️ [${timestamp}] BOUNDS EFFECT TRIGGERED - mapReady: ${mapReady}, targetStore: ${!!targetStore}, hasTargetStoreRef: ${hasTargetStoreRef.current}, validStores: ${validStores.length}`);
    
    // Only run this effect if there's NO target store (check both state and ref)
    if (!mapInstance.current || !mapReady || targetStore || hasTargetStoreRef.current || validStores.length === 0) {
      console.log(`❌ [${timestamp}] Bounds effect skipped - mapInstance: ${!!mapInstance.current}, mapReady: ${mapReady}, hasTargetStore: ${!!targetStore}, hasTargetStoreRef: ${hasTargetStoreRef.current}, validStores: ${validStores.length}`);
      return;
    }

    // Default behavior: fit to all stores when no target store
    console.log(`ℹ️ [${timestamp}] No target store, fitting to all ${validStores.length} stores`);

    const timer = setTimeout(() => {
      // Double-check targetStore and ref haven't been set since the effect started
      if (targetStore || hasTargetStoreRef.current) {
        console.log(`❌ [${timestamp + 300}] Bounds effect cancelled - targetStore: ${!!targetStore}, hasTargetStoreRef: ${hasTargetStoreRef.current}`);
        return;
      }
      
      console.log(`🗺️ [${timestamp + 300}] BOUNDS EFFECT EXECUTING fitBounds`);
      try {
        let bounds: L.LatLngBounds | null = null;
        
        validStores.forEach(store => {
          const lat = parseFloat(store.lat);
          const lng = parseFloat(store.lng);
          
          if (!bounds) {
            bounds = L.latLngBounds([lat, lng], [lat, lng]);
          } else {
            bounds!.extend([lat, lng]);
          }
        });

        // Add user location to bounds if available
        if (userLocation && bounds) {
          (bounds as L.LatLngBounds).extend([userLocation.latitude, userLocation.longitude]);
        }

        if (bounds && mapInstance.current) {
          console.log(`🗺️ [${timestamp + 300}] Fitting bounds to all stores`);
          mapInstance.current.fitBounds(bounds, { 
            padding: isMobile ? [40, 40] : [20, 20],
            maxZoom: isMobile ? 15 : 16
          });
          console.log(`🗺️ [${timestamp + 300}] fitBounds executed`);
        }
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }, 300); // Longer delay to ensure target store effect runs first

    return () => clearTimeout(timer);
  }, [mapReady, validStores, userLocation, isMobile]); // Removed targetStore from dependency array to prevent re-runs

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ minHeight: '400px' }}
      />

      {/* Loading indicator */}
      {isLoadingLocation && (
        <div className={`absolute ${isMobile ? 'top-2 left-2 right-2' : 'top-4 left-4'} bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded-lg shadow-lg z-[1000]`}>
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className={`${isMobile ? 'text-sm' : 'text-sm'}`}>Getting your location...</span>
          </div>
        </div>
      )}

      {/* Location error message */}
      {locationError && (
        <div className={`absolute ${isMobile ? 'top-2 left-2 right-2' : 'top-4 left-4'} bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg shadow-lg max-w-sm z-[1000]`}>
          <p className={`${isMobile ? 'text-sm' : 'text-sm'}`}>
            <strong>Location unavailable:</strong> {locationError}
          </p>
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} mt-1`}>
            Map will show Canada-wide view
          </p>
        </div>
      )}

      {/* Mobile-optimized map controls */}
      <div className={`absolute ${isMobile ? 'bottom-4 left-4 right-4' : 'top-4 right-4'} flex ${isMobile ? 'flex-row justify-between' : 'flex-col'} gap-2 z-[1000] transition-opacity duration-300 ${showControls || !isMobile ? 'opacity-100' : 'opacity-30'}`}>
        {isMobile ? (
          // Mobile layout - horizontal controls at bottom
          <>
            {userLocation && mapInstance.current && (
              <button
                onClick={() => {
                  if (mapInstance.current && userLocation) {
                    mapInstance.current.setView([userLocation.latitude, userLocation.longitude], 12);
                  }
                }}
                className="bg-white shadow-lg rounded-full p-3 text-sm hover:bg-gray-50 border flex-1 max-w-[120px] flex items-center justify-center"
              >
                <span className="text-lg">📍</span>
              </button>
            )}
            
            {mapInstance.current && (
              <button
                onClick={() => {
                  if (!mapInstance.current || validStores.length === 0) return;
                  
                  let bounds: L.LatLngBounds | null = null;
                   
                   validStores.forEach(store => {
                     const lat = parseFloat(store.lat);
                     const lng = parseFloat(store.lng);
                     
                     if (!bounds) {
                       bounds = L.latLngBounds([lat, lng], [lat, lng]);
                     } else {
                       bounds!.extend([lat, lng]);
                     }
                   });

                  if (userLocation && bounds) {
                    (bounds as L.LatLngBounds).extend([userLocation.latitude, userLocation.longitude]);
                  }

                  if (bounds) {
                    mapInstance.current.fitBounds(bounds, { 
                      padding: [40, 40],
                      maxZoom: 15
                    });
                  }
                }}
                className="bg-white shadow-lg rounded-full p-3 text-sm hover:bg-gray-50 border flex-1 max-w-[120px] flex items-center justify-center"
              >
                <span className="text-lg">🗺️</span>
              </button>
            )}
            
            <div className="bg-white shadow-lg rounded-full px-4 py-3 text-sm border flex items-center justify-center min-w-[80px]">
              <div className="text-center">
                <div className="font-medium text-xs">{validStores.length}</div>
                <div className="text-xs text-gray-500">stores</div>
              </div>
            </div>
          </>
        ) : (
          // Desktop layout - vertical controls at top right
          <>
            {userLocation && mapInstance.current && (
              <button
                onClick={() => {
                  if (mapInstance.current && userLocation) {
                    mapInstance.current.setView([userLocation.latitude, userLocation.longitude], 12);
                  }
                }}
                className="bg-white shadow-lg rounded px-3 py-2 text-sm hover:bg-gray-50 border"
              >
                📍 My Location
              </button>
            )}
            
            {mapInstance.current && (
              <button
                onClick={() => {
                  if (!mapInstance.current || validStores.length === 0) return;
                  
                                   let bounds: L.LatLngBounds | null = null;
                     
                     validStores.forEach(store => {
                       const lat = parseFloat(store.lat);
                       const lng = parseFloat(store.lng);
                       
                       if (!bounds) {
                         bounds = L.latLngBounds([lat, lng], [lat, lng]);
                       } else {
                         bounds!.extend([lat, lng]);
                       }
                     });

                    if (userLocation && bounds) {
                      (bounds as L.LatLngBounds).extend([userLocation.latitude, userLocation.longitude]);
                    }

                    if (bounds) {
                      mapInstance.current.fitBounds(bounds, { padding: [20, 20] });
                    }
                }}
                className="bg-white shadow-lg rounded px-3 py-2 text-sm hover:bg-gray-50 border"
              >
                🗺️ Fit to Stores
              </button>
            )}
            
            <div className="bg-white shadow-lg rounded px-3 py-2 text-sm border">
              <div className="font-medium">{validStores.length} stores</div>
              <div className="text-xs text-gray-500">on map</div>
            </div>
          </>
        )}
      </div>

      {/* Status indicator */}
      {mapReady && (
        <div className={`absolute ${isMobile ? 'top-2 right-2' : 'bottom-4 left-4'} bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-lg shadow-lg z-[1000]`}>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
              {isMobile ? 'Ready' : 'Map ready with npm Leaflet'}
            </span>
          </div>
        </div>
      )}

      {/* Custom styles */}
      <style>{`
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

        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .leaflet-popup-content {
          margin: 8px 12px;
          line-height: 1.4;
        }
        
        .leaflet-popup-content h3 {
          margin-top: 0;
        }

        .store-marker:hover {
          transform: scale(1.1) !important;
        }

        .leaflet-popup-close-button {
          font-size: 18px !important;
          padding: 4px 8px !important;
        }

        @media (max-width: 768px) {
          .leaflet-popup-content-wrapper {
            border-radius: 12px;
          }
          
          .leaflet-control-zoom {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
} 