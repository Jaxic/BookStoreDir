/** @jsxImportSource react */
import { useEffect, useRef } from 'react';

interface WorkingMapProps {
  stores?: any[];
}

export default function WorkingMap({ stores = [] }: WorkingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Wait for Leaflet to be available
    const initMap = () => {
      const L = (window as any).L;
      if (!L || mapInstanceRef.current) return;

      try {
        console.log('Creating map...');
        
        // Create map using Leaflet documentation pattern
        const map = new L.Map(mapRef.current).setView([43.6532, -79.3832], 4);

        // Add tile layer
        new L.TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add a simple test marker
        new L.Marker([43.6532, -79.3832])
          .addTo(map)
          .bindPopup('Test marker - React + Leaflet working!')
          .openPopup();

        // Add markers for first 3 stores if available
        if (stores.length > 0) {
          stores.slice(0, 3).forEach((store, index) => {
            const lat = parseFloat(store.lat);
            const lng = parseFloat(store.lng);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              new L.Marker([lat, lng])
                .addTo(map)
                .bindPopup(`<b>${store.name}</b><br/>${store.city}, ${store.province}`);
            }
          });
        }

        mapInstanceRef.current = map;
        console.log('Map created successfully!');

      } catch (error) {
        console.error('Error creating map:', error);
      }
    };

    // Check if Leaflet is available, if not wait for it
    if ((window as any).L) {
      initMap();
    } else {
      // Poll for Leaflet availability
      const checkInterval = setInterval(() => {
        if ((window as any).L) {
          clearInterval(checkInterval);
          initMap();
        }
      }, 100);

      // Cleanup interval after 5 seconds
      setTimeout(() => clearInterval(checkInterval), 5000);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stores]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="bg-green-600 text-white p-2 text-center">
        <h2 className="text-lg font-bold">Working Map - React + Leaflet</h2>
        <p className="text-sm">Using proper Leaflet documentation patterns</p>
      </div>
      <div 
        ref={mapRef} 
        className="flex-1"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
} 