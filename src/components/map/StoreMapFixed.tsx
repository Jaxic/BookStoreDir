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
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
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

  // Check geolocation permission status
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      console.warn('Geolocation not supported');
      setLocationError('Geolocation not supported');
      setLocationPermission('denied');
      return;
    }

    // Check if Permissions API is supported
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log(`🔍 Geolocation permission status: ${result.state}`);
        setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
        
        if (result.state === 'granted') {
          // Permission already granted, get location immediately
          getCurrentLocation();
        } else if (result.state === 'prompt') {
          // Show UI to request permission
          setShowLocationPrompt(true);
        } else if (result.state === 'denied') {
          setLocationError('Location access denied');
        }

        // Listen for permission changes
        result.addEventListener('change', () => {
          console.log(`🔄 Geolocation permission changed to: ${result.state}`);
          setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
          
          if (result.state === 'granted') {
            getCurrentLocation();
            setShowLocationPrompt(false);
          } else if (result.state === 'denied') {
            setLocationError('Location access denied');
            setShowLocationPrompt(false);
          }
        });
      }).catch((error) => {
        console.warn('Permissions API not fully supported:', error);
        // Fallback: show prompt to request location
        setShowLocationPrompt(true);
        setLocationPermission('prompt');
      });
    } else {
      // Permissions API not supported, show prompt
      console.warn('Permissions API not supported');
      setShowLocationPrompt(true);
      setLocationPermission('prompt');
    }
  }, []);

  // Function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsLoadingLocation(true);
    setLocationError(null);
    
    console.log('📍 Requesting user location...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(userPos);
        setIsLoadingLocation(false);
        setLocationError(null);
        setShowLocationPrompt(false);
        console.log(`✅ Successfully got user location: ${userPos.latitude}, ${userPos.longitude}`);
        
        // Add user marker to map if map is ready
        if (mapInstance.current) {
          addUserMarker(userPos.latitude, userPos.longitude);
        }
      },
      (error) => {
        console.error('❌ Error getting location:', error);
        setIsLoadingLocation(false);
        
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            setLocationPermission('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        setShowLocationPrompt(false);
      },
      { 
        timeout: 15000, 
        enableHighAccuracy: true,
        maximumAge: 300000 
      }
    );
  };

  // Function to request location permission (must be called from user interaction)
  const requestLocationPermission = () => {
    console.log('🔐 Requesting location permission...');
    getCurrentLocation();
  };

  // Function to add user marker to map
  const addUserMarker = (lat: number, lng: number) => {
    if (!mapInstance.current) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      mapInstance.current.removeLayer(userMarkerRef.current);
    }

    const userIconSize = isMobile ? 20 : 16;
    const userIcon = new L.DivIcon({
      className: 'user-location-icon',
      html: `<div style='background-color:#ef4444;width:${userIconSize}px;height:${userIconSize}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);position:relative;'>
        <div style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:6px;height:6px;background-color:white;border-radius:50%;'></div>
      </div>`,
      iconSize: [userIconSize, userIconSize],
      iconAnchor: [userIconSize/2, userIconSize/2]
    });

    // Create user marker
    const userMarker = new L.Marker([lat, lng], {
      icon: userIcon,
      zIndexOffset: 1000 // Ensure user marker appears above store markers
    });

    userMarker.bindPopup(`
      <div style="font-family:system-ui,sans-serif;text-align:center;min-width:150px;">
        <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:bold;color:#ef4444;">📍 Your Location</h3>
        <p style="margin:0;color:#666;font-size:14px;">Lat: ${lat.toFixed(6)}</p>
        <p style="margin:0;color:#666;font-size:14px;">Lng: ${lng.toFixed(6)}</p>
      </div>
    `, {
      closeButton: true,
      autoPan: true
    });

    userMarker.addTo(mapInstance.current);
    userMarkerRef.current = userMarker;

    console.log('✅ Added user location marker to map');
  };

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

  // Add user location marker when location is available and map is ready
  useEffect(() => {
    if (userLocation && mapInstance.current && mapReady) {
      addUserMarker(userLocation.latitude, userLocation.longitude);
    }
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

      {/* Location Error Message */}
      {locationError && !showLocationPrompt && (
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-red-700">{locationError}</span>
            <button
              onClick={() => setLocationError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Location Button */}
          <button
            onClick={requestLocationPermission}
            disabled={isLoadingLocation || locationPermission === 'denied'}
            className={`
              p-3 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center
              ${isLoadingLocation 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : locationPermission === 'denied'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : userLocation
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-white text-gray-700 hover:bg-gray-50'
              }
            `}
            title={
              locationPermission === 'denied' 
                ? 'Location access denied' 
                : isLoadingLocation 
                ? 'Getting your location...' 
                : userLocation 
                ? 'Location found' 
                : 'Find my location'
            }
          >
            {isLoadingLocation ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : userLocation ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>

          {/* Toggle Controls Button */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="p-3 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            title="Toggle controls"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      )}

      {/* Location Permission Prompt */}
      {showLocationPrompt && (
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Find bookstores near you
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Allow location access to see nearby bookstores and get directions.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={requestLocationPermission}
                  disabled={isLoadingLocation}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Getting location...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Allow Location
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowLocationPrompt(false)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowLocationPrompt(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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