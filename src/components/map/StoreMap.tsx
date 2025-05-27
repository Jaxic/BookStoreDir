/** @jsxImportSource react */
import { useEffect, useRef, useState, useMemo } from 'react';
import type { ProcessedBookstore } from '../../types/bookstore';

interface StoreMapProps {
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

export default function StoreMap({ 
  stores, 
  height = "100%",
  className = ""
}: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerClusterGroupRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [hasInitiallyFitted, setHasInitiallyFitted] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Checking environment...');

  // Display all stores passed from parent (filtering is handled by StoreMapView)
  const filteredStores = useMemo(() => {
    console.log(`StoreMap displaying ${stores.length} stores`);
    return stores;
  }, [stores]);

  // Clean up marker cluster group
  const clearMarkers = () => {
    if (markerClusterGroupRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerClusterGroupRef.current);
      markerClusterGroupRef.current.clearLayers();
    }
  };

  // Enhanced Leaflet loading with multiple fallback strategies
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoadingStatus('Server-side rendering...');
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let attemptCount = 0;
    const maxAttempts = 50; // 50 * 200ms = 10 seconds
    
    const loadLeaflet = async () => {
      try {
        console.log('🔄 Starting enhanced Leaflet loading process...');
        setLoadingStatus('Checking for Leaflet scripts...');
        
        // Strategy 1: Check if scripts are already loaded
        const checkScriptsLoaded = () => {
          const leafletScript = document.querySelector('script[src*="leaflet.js"]');
          const clusterScript = document.querySelector('script[src*="leaflet.markercluster"]');
          const leafletCSS = document.querySelector('link[href*="leaflet.css"]');
          
          console.log('Script elements found:', {
            leafletScript: !!leafletScript,
            clusterScript: !!clusterScript,
            leafletCSS: !!leafletCSS
          });
          
          return leafletScript && clusterScript && leafletCSS;
        };

        // Strategy 2: Check global objects
        const checkGlobalObjects = () => {
          const L = (window as any).L;
          if (!L) return false;
          
          const hasRequired = !!(L.Map && L.TileLayer && L.marker && L.markerClusterGroup);
          console.log('Global L object check:', {
            L: !!L,
            version: L.version || 'unknown',
            Map: !!L.Map,
            TileLayer: !!L.TileLayer,
            marker: !!L.marker,
            markerClusterGroup: !!L.markerClusterGroup
          });
          
          return hasRequired;
        };

        // Strategy 3: Wait with progressive checking
        const waitForLeaflet = () => {
          return new Promise<void>((resolve, reject) => {
            const check = () => {
              attemptCount++;
              setLoadingStatus(`Loading attempt ${attemptCount}/${maxAttempts}...`);
              
              console.log(`🔍 Loading attempt ${attemptCount}/${maxAttempts}`);
              
              if (checkGlobalObjects()) {
                console.log('✅ Leaflet libraries are ready!');
                setLoadingStatus('Leaflet loaded successfully!');
                resolve();
                return;
              }
              
              if (attemptCount >= maxAttempts) {
                reject(new Error(`Failed to load Leaflet after ${maxAttempts} attempts`));
                return;
              }
              
              // Exponential backoff: start fast, slow down
              const delay = attemptCount < 10 ? 100 : attemptCount < 30 ? 200 : 500;
              setTimeout(check, delay);
            };

            // Start immediately
            check();
          });
        };

        // Strategy 4: If scripts aren't in DOM, wait for them to be added
        if (!checkScriptsLoaded()) {
          setLoadingStatus('Waiting for scripts to load...');
          console.log('⚠️ Leaflet scripts not found in DOM, waiting...');
          
          // Watch for script additions
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    if (element.tagName === 'SCRIPT' && element.getAttribute('src')?.includes('leaflet')) {
                      console.log('📜 Detected Leaflet script addition:', element.getAttribute('src'));
                    }
                  }
                });
              }
            });
          });
          
          observer.observe(document.head, { childList: true, subtree: true });
          
          // Clean up observer after timeout
          timeoutId = setTimeout(() => observer.disconnect(), 15000);
        }

        await waitForLeaflet();
        
        if (timeoutId) clearTimeout(timeoutId);
        console.log('🎉 Leaflet libraries successfully loaded!');
        setLeafletLoaded(true);

      } catch (error) {
        console.error('❌ Failed to load Leaflet:', error);
        setLoadingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setLeafletLoaded(false);
        
        // Provide detailed debugging info
        console.log('🔍 Debug information:');
        console.log('- Window object:', typeof window);
        console.log('- Document ready state:', document.readyState);
        console.log('- Scripts in head:', document.head.querySelectorAll('script').length);
        console.log('- Leaflet scripts:', document.querySelectorAll('script[src*="leaflet"]').length);
        console.log('- Global L:', typeof (window as any).L);
      }
    };

    loadLeaflet();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Get user's location (always attempt to get location for distance calculations)
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
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userPos);
        setIsLoadingLocation(false);
        console.log(`✅ Successfully got user location: ${userPos.lat}, ${userPos.lng}`);
      },
      (error) => {
        console.error('❌ Error getting location:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        setLocationError(`Location access denied: ${error.message}`);
        setIsLoadingLocation(false);
      },
      { 
        timeout: 15000, 
        enableHighAccuracy: false,
        maximumAge: 300000 
      }
    );
  }, []); // Always try to get location

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    const L = (window as any).L;
    
    try {
      console.log('🗺️ Creating interactive store map with clustering...');
      
      // Create map with default center (will be updated when location is available)
      const map = L.map(mapRef.current).setView([56.1304, -106.3468], 4);

      // Add tile layer
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Create marker cluster group with custom options
      const markers = L.markerClusterGroup({
        // Custom cluster icon creation
        iconCreateFunction: function(cluster: any) {
          const childCount = cluster.getChildCount();
          let clusterClass = 'marker-cluster-';
          
          // Different styles based on cluster size
          if (childCount < 10) {
            clusterClass += 'small';
          } else if (childCount < 50) {
            clusterClass += 'medium';
          } else {
            clusterClass += 'large';
          }

          return L.divIcon({
            html: `
              <div class="cluster-inner">
                <div class="cluster-icon">📚</div>
                <div class="cluster-count">${childCount}</div>
              </div>
            `,
            className: `marker-cluster ${clusterClass}`,
            iconSize: L.point(40, 40)
          });
        },
        // Cluster behavior options
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50, // Maximum radius for clustering (in pixels)
        disableClusteringAtZoom: 15 // Disable clustering at high zoom levels
      });

      markerClusterGroupRef.current = markers;
      mapInstanceRef.current = map;
      setMapReady(true);
      console.log('✅ Store map with clustering created successfully!');

    } catch (error) {
      console.error('❌ Error creating store map:', error);
    }

    // Cleanup function
    return () => {
      clearMarkers();
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Add user location marker and fit map to show nearby stores (only once initially)
  useEffect(() => {
    console.log('=== USER LOCATION MARKER EFFECT ===');
    console.log('mapReady:', mapReady);
    console.log('mapInstance:', !!mapInstanceRef.current);
    console.log('userLocation:', userLocation);
    
    if (!mapReady || !mapInstanceRef.current || !userLocation) {
      console.log('Skipping user location marker - missing requirements');
      return;
    }

    const L = (window as any).L;
    if (!L) {
      console.log('Leaflet not available for user marker');
      return;
    }

    console.log('Creating user location marker...');

    // Remove existing user marker
    if (userMarkerRef.current) {
      console.log('Removing existing user marker');
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    try {
      // Create custom user location icon
      const userIcon = L.divIcon({
        html: `
          <div class="user-marker">
            <div class="user-marker-inner">📍</div>
          </div>
        `,
        className: 'user-location-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Create user location marker using custom icon
      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('📍 Your Location');

      userMarkerRef.current = userMarker;
      console.log('✅ User location marker created successfully at:', userLocation.lat, userLocation.lng);

      // Auto-zoom to user's area on first load (but don't restrict view)
      if (!hasInitiallyFitted) {
        console.log('Auto-centering on user location...');
        // Center on user with city-level zoom
        mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 11);
        setHasInitiallyFitted(true);
      }

    } catch (error) {
      console.error('❌ Error creating user location marker:', error);
    }

  }, [mapReady, userLocation, filteredStores, hasInitiallyFitted]);

  // Add store markers to cluster group when map is ready and stores change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markerClusterGroupRef.current) {
      console.log('Skipping markers: mapReady=', mapReady, 'mapInstance=', !!mapInstanceRef.current, 'clusterGroup=', !!markerClusterGroupRef.current);
      return;
    }

    const L = (window as any).L;
    if (!L) {
      console.log('Leaflet not available');
      return;
    }

    // Use filtered stores
    const storesToDisplay = filteredStores;
    console.log('=== CLUSTERED MARKER UPDATE ===');
    console.log('Stores to display:', storesToDisplay.length);
    
    // Clear existing markers from cluster group
    markerClusterGroupRef.current.clearLayers();
    
    if (!storesToDisplay.length) {
      console.log('No stores to display - cluster group cleared');
      return;
    }

    console.log(`Adding ${storesToDisplay.length} store markers to cluster group...`);

    // Create all markers and add to cluster group
    let successfulMarkers = 0;
    const failedStores: string[] = [];
    
    storesToDisplay.forEach((store) => {
      const lat = parseFloat(store.lat);
      const lng = parseFloat(store.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coordinates for store ${store.name}: [${lat}, ${lng}]`);
        failedStores.push(store.name);
        return;
      }

      try {
        // Create custom bookstore icon
        const storeIcon = L.divIcon({
          html: `
            <div class="store-marker">
              <div class="marker-pin">📚</div>
            </div>
          `,
          className: 'custom-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = L.marker([lat, lng], { icon: storeIcon });
        
        // Enhanced popup content
        const distance = userLocation ? 
          calculateDistance(userLocation.lat, userLocation.lng, lat, lng) : null;
        
        const popupContent = `
          <div class="store-popup">
            <h3 class="font-bold text-lg mb-2">${store.name}</h3>
            <p class="text-gray-600 mb-1">${store.address}</p>
            <p class="text-gray-600 mb-2">${store.city}, ${store.province}</p>
            ${distance !== null ? `<p class="text-sm mb-1 text-blue-600">📍 ${distance.toFixed(1)}km away</p>` : ''}
            ${store.phone ? `<p class="text-sm mb-1">📞 ${store.phone}</p>` : ''}
            ${store.website ? `<p class="text-sm mb-1"><a href="${store.website}" target="_blank" class="text-blue-600 hover:underline">🌐 Website</a></p>` : ''}
            ${store.ratingInfo ? `<p class="text-sm">⭐ ${store.ratingInfo.rating}/5 (${store.ratingInfo.numReviews} reviews)</p>` : ''}
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          maxWidth: 300
        });
        
        // Add marker to cluster group
        markerClusterGroupRef.current.addLayer(marker);
        successfulMarkers++;

      } catch (error) {
        console.error('Error creating marker for store:', store.name, error);
        failedStores.push(store.name);
      }
    });
    
    // Add cluster group to map
    mapInstanceRef.current.addLayer(markerClusterGroupRef.current);
    
    console.log(`Successfully added ${successfulMarkers} markers to cluster group out of ${storesToDisplay.length} stores`);
    if (failedStores.length > 0) {
      console.warn(`Failed to create markers for ${failedStores.length} stores:`, failedStores);
    }

  }, [mapReady, filteredStores]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Loading indicator */}
      {(!leafletLoaded || !mapReady || isLoadingLocation) && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 font-medium">
              {!leafletLoaded ? loadingStatus : !mapReady ? 'Initializing map...' : 'Getting your location...'}
            </p>
            {!leafletLoaded && (
              <p className="text-xs text-gray-500 mt-2 max-w-sm">
                If this takes too long, try refreshing the page
              </p>
            )}
          </div>
        </div>
      )}

      {/* Location error message */}
      {locationError && mapReady && (
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
        {userLocation && mapReady && (
          <button
            onClick={() => {
              if (mapInstanceRef.current && userLocation) {
                mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 12);
              }
            }}
            className="bg-white shadow-lg rounded px-3 py-2 text-sm hover:bg-gray-50 border"
          >
            📍 My Location
          </button>
        )}
        
        {mapReady && (
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                if (userLocation && filteredStores.length > 0) {
                  // Fit to filtered stores
                  const L = (window as any).L;
                  const bounds = L.latLngBounds();
                  bounds.extend([userLocation.lat, userLocation.lng]);
                  filteredStores.slice(0, 50).forEach(store => {
                    const lat = parseFloat(store.lat);
                    const lng = parseFloat(store.lng);
                    if (!isNaN(lat) && !isNaN(lng)) {
                      bounds.extend([lat, lng]);
                    }
                  });
                  mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
                } else {
                  // Fallback to Canada view
                  mapInstanceRef.current.setView([56.1304, -106.3468], 4);
                }
              }
            }}
            className="bg-white shadow-lg rounded px-3 py-2 text-sm hover:bg-gray-50 border"
          >
            Reset View
          </button>
        )}
        
        {mapReady && (
          <div className="bg-white shadow-lg rounded px-3 py-2 text-sm border">
            <div className="font-medium">{filteredStores.length} stores</div>
            <div className="text-xs text-gray-500">
              on map
            </div>
          </div>
        )}
      </div>

      {/* Custom styles */}
      <style>{`
        /* Individual store marker styles */
        .store-marker {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: white;
          border: 2px solid #2563eb;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .store-marker:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .marker-pin {
          font-size: 16px;
        }

        /* User location marker styles */
        .user-marker {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }

        .user-marker-inner {
          color: white;
          font-size: 12px;
        }

        /* Cluster marker styles */
        .marker-cluster {
          background-clip: padding-box;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .marker-cluster-small {
          background-color: rgba(59, 130, 246, 0.6);
          border: 3px solid rgba(59, 130, 246, 0.8);
        }

        .marker-cluster-medium {
          background-color: rgba(16, 185, 129, 0.6);
          border: 3px solid rgba(16, 185, 129, 0.8);
        }

        .marker-cluster-large {
          background-color: rgba(245, 158, 11, 0.6);
          border: 3px solid rgba(245, 158, 11, 0.8);
        }

        .cluster-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .cluster-icon {
          font-size: 14px;
          line-height: 1;
        }

        .cluster-count {
          font-size: 11px;
          line-height: 1;
          margin-top: 1px;
        }

        /* Cluster hover effects */
        .marker-cluster:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        /* Popup styles */
        .store-popup {
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          padding: 0;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 16px;
        }
      `}</style>
    </div>
  );
} 