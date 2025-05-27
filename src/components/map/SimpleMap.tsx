/** @jsxImportSource react */
import { useEffect, useRef, useState } from 'react';

export default function SimpleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    if (typeof window === 'undefined') {
      setStatus('Server side - waiting for client...');
      return;
    }

    setStatus('Checking for Leaflet...');

    const initMap = () => {
      if (!(window as any).L) {
        setStatus('Leaflet not found on window');
        return;
      }

      if (!mapRef.current) {
        setStatus('Map container not found');
        return;
      }

      try {
        setStatus('Creating map...');
        
        const L = (window as any).L;
        
        // Simple map creation
        const map = L.map(mapRef.current).setView([43.6532, -79.3832], 10); // Toronto
        
        setStatus('Adding tile layer...');
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        setStatus('Adding test marker...');
        
        // Add one test marker
        L.marker([43.6532, -79.3832])
          .addTo(map)
          .bindPopup('Test marker - if you see this, the map works!')
          .openPopup();
        
        setStatus('Map loaded successfully!');
        
      } catch (error) {
        setStatus(`Error: ${error}`);
        console.error('Map error:', error);
      }
    };

    // Try immediately
    if ((window as any).L) {
      initMap();
    } else {
      // Wait for Leaflet to load
      const checkInterval = setInterval(() => {
        if ((window as any).L) {
          clearInterval(checkInterval);
          initMap();
        }
      }, 100);

      // Give up after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (status === 'Checking for Leaflet...') {
          setStatus('Timeout - Leaflet failed to load');
        }
      }, 5000);
    }
  }, []);

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="bg-blue-600 text-white p-4 text-center">
        <h1 className="text-xl font-bold">Simple Map Test</h1>
        <p className="text-sm">Status: {status}</p>
      </div>
      <div 
        ref={mapRef} 
        className="flex-1 bg-gray-200"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
} 