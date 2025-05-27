/** @jsxImportSource react */
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ProcessedBookstore } from '../../types/bookstore';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface StoreMapProps {
  stores: ProcessedBookstore[];
  selectedStore?: ProcessedBookstore | null;
  onStoreSelect?: (store: ProcessedBookstore) => void;
  height?: string;
  className?: string;
}

// Custom bookstore icon
const createBookstoreIcon = (isSelected: boolean = false) => {
  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${isSelected ? '#2563eb' : '#dc2626'};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: all 0.2s ease;
      " class="bookstore-marker">
        <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
          <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2z"/>
        </svg>
      </div>
    `,
    className: 'bookstore-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export default function StoreMap({ 
  stores, 
  selectedStore, 
  onStoreSelect, 
  height = '500px',
  className = '' 
}: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    try {
      // Create map centered on Canada
      const map = L.map(mapRef.current, {
        center: [56.1304, -106.3468], // Center of Canada
        zoom: 4,
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      setIsLoading(false);

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(userPos);
            
            // Add user location marker
            const userIcon = L.divIcon({
              html: `
                <div style="
                  width: 20px;
                  height: 20px;
                  background-color: #3b82f6;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
              `,
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            
            L.marker([userPos.lat, userPos.lng], { icon: userIcon })
              .addTo(map)
              .bindPopup('Your Location')
              .openPopup();
          },
          (error) => {
            console.log('Could not get user location:', error.message);
          },
          { 
            timeout: 10000, 
            enableHighAccuracy: false,
            maximumAge: 300000 
          }
        );
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update markers when stores change
  useEffect(() => {
    if (!leafletMapRef.current || isLoading) return;

    const map = leafletMapRef.current;
    const markers = markersRef.current;

    // Clear existing markers
    markers.forEach(marker => {
      map.removeLayer(marker);
    });
    markers.clear();

    // Add new markers
    const validStores = stores.filter(store => {
      const lat = parseFloat(store.lat);
      const lng = parseFloat(store.lng);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });

    if (validStores.length === 0) return;

    const bounds = L.latLngBounds([]);

    validStores.forEach(store => {
      const lat = parseFloat(store.lat);
      const lng = parseFloat(store.lng);
      const isSelected = selectedStore?.place_id === store.place_id;
      
      const marker = L.marker([lat, lng], { 
        icon: createBookstoreIcon(isSelected)
      });

      // Create popup content
      const popupContent = `
        <div style="min-width: 250px; font-family: system-ui, sans-serif;">
          <div style="margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
              ${store.name}
            </h3>
          </div>
          ${store.description ? `
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">
              ${store.description}
            </p>
          ` : ''}
          <div style="margin-bottom: 8px;">
            <p style="margin: 0; font-size: 14px; color: #4b5563;">
              📍 ${store.address}, ${store.city}, ${store.province}
            </p>
          </div>
          ${store.phone ? `
            <div style="margin-bottom: 8px;">
              <p style="margin: 0; font-size: 14px; color: #4b5563;">
                📞 <a href="tel:${store.phone}" style="color: #059669; text-decoration: none;">${store.phone}</a>
              </p>
            </div>
          ` : ''}
          ${store.website ? `
            <div style="margin-bottom: 8px;">
              <p style="margin: 0; font-size: 14px; color: #4b5563;">
                🌐 <a href="${store.website}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: none;">Visit Website</a>
              </p>
            </div>
          ` : ''}
          ${store.ratingInfo?.rating ? `
            <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
              <span style="color: #fbbf24;">★</span>
              <span style="font-size: 14px; color: #4b5563;">
                ${store.ratingInfo.rating.toFixed(1)} (${store.ratingInfo.numReviews || 0} reviews)
              </span>
            </div>
          ` : ''}
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <button 
              onclick="window.dispatchEvent(new CustomEvent('storeSelect', { detail: { storeId: '${store.place_id}' } }))"
              style="
                background-color: #2563eb;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                width: 100%;
                transition: background-color 0.2s;
              "
              onmouseover="this.style.backgroundColor='#1d4ed8'"
              onmouseout="this.style.backgroundColor='#2563eb'"
            >
              View Details
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      // Handle marker click
      marker.on('click', () => {
        if (onStoreSelect) {
          onStoreSelect(store);
        }
      });

      marker.addTo(map);
      markers.set(store.place_id, marker);
      bounds.extend([lat, lng]);
    });

    // Fit map to show all markers
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 15
      });
    }

  }, [stores, selectedStore, onStoreSelect, isLoading]);

  // Handle custom store selection events from popup buttons
  useEffect(() => {
    const handleStoreSelect = (event: any) => {
      const { storeId } = event.detail;
      const store = stores.find(s => s.place_id === storeId);
      if (store && onStoreSelect) {
        onStoreSelect(store);
      }
    };

    window.addEventListener('storeSelect', handleStoreSelect);
    return () => window.removeEventListener('storeSelect', handleStoreSelect);
  }, [stores, onStoreSelect]);

  // Handle external store selection (update marker styles)
  useEffect(() => {
    if (!leafletMapRef.current || !selectedStore) return;

    const markers = markersRef.current;
    
    // Update all markers to reflect selection state
    markers.forEach((marker, storeId) => {
      const isSelected = storeId === selectedStore.place_id;
      marker.setIcon(createBookstoreIcon(isSelected));
    });

    // Pan to selected store
    const selectedMarker = markers.get(selectedStore.place_id);
    if (selectedMarker) {
      const map = leafletMapRef.current;
      map.setView(selectedMarker.getLatLng(), Math.max(map.getZoom(), 12), {
        animate: true,
        duration: 0.5
      });
      selectedMarker.openPopup();
    }
  }, [selectedStore]);

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="z-0"
      />
      
      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {userLocation && (
          <button
            onClick={() => {
              if (leafletMapRef.current) {
                leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 12, {
                  animate: true,
                  duration: 0.5
                });
              }
            }}
            className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Go to my location"
            aria-label="Center map on your location"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
        
        <button
          onClick={() => {
            if (leafletMapRef.current) {
              const markers = markersRef.current;
              if (markers.size > 0) {
                const bounds = L.latLngBounds([]);
                markers.forEach(marker => {
                  bounds.extend(marker.getLatLng());
                });
                leafletMapRef.current.fitBounds(bounds, {
                  padding: [20, 20],
                  maxZoom: 15
                });
              }
            }
          }}
          className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Show all stores"
          aria-label="Zoom to show all bookstores"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Store Count Indicator */}
      <div className="absolute bottom-4 left-4 z-10 bg-white px-3 py-1 rounded-lg shadow-md">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">{stores.length}</span> bookstore{stores.length !== 1 ? 's' : ''} shown
        </p>
      </div>
    </div>
  );
} 