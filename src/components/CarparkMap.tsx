import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark } from '../types/carpark';
import { Navigation, Compass, Zap, ShieldAlert } from 'lucide-react';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  isDarkMode: boolean;
  onLocateMe: () => void;
  userLocation: { lat: number; lng: number } | null;
}

const SG_ZONES = [
  { name: 'Central / CBD', lat: 1.2838, lng: 103.8585, zoom: 14 },
  { name: 'Orchard Rd', lat: 1.3040, lng: 103.8319, zoom: 15 },
  { name: 'Jurong East', lat: 1.3337, lng: 103.7432, zoom: 14 },
  { name: 'Tampines', lat: 1.3533, lng: 103.9405, zoom: 14 },
  { name: 'Toa Payoh', lat: 1.3343, lng: 103.8510, zoom: 15 },
  { name: 'Changi Airport', lat: 1.3602, lng: 103.9897, zoom: 14 },
];

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  isDarkMode,
  onLocateMe,
  userLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [1.3250, 103.8400],
      zoom: 12,
      zoomControl: false,
    });

    // Clean CartoDB tile layer
    const tileUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update theme tiles
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    tileLayerRef.current.setUrl(tileUrl);
  }, [isDarkMode]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // User location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping"></div>
            <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(markersLayerRef.current)
        .bindPopup('<div class="p-2 text-xs font-semibold">Your Location</div>');
    }

    // Carpark markers
    carparks.forEach((cp) => {
      const isSelected = selectedCarpark?.id === cp.id;

      // Color coding logic
      let bgClass = 'bg-emerald-600 text-white';
      let ringClass = 'ring-emerald-200 dark:ring-emerald-900';
      if (cp.availableLots === 0) {
        bgClass = 'bg-rose-600 text-white';
        ringClass = 'ring-rose-200 dark:ring-rose-900';
      } else if (cp.availableLots < 25) {
        bgClass = 'bg-amber-600 text-white';
        ringClass = 'ring-amber-200 dark:ring-amber-900';
      }

      const isEV = cp.hasEvCharging;

      const markerHtml = `
        <button class="group flex flex-col items-center focus:outline-none transition-transform hover:scale-110 active:scale-95 ${
          isSelected ? 'scale-115 z-50' : ''
        }">
          <div class="px-2.5 py-1 rounded-full shadow-lg font-mono text-xs font-bold flex items-center gap-1 border border-white/60 dark:border-slate-800 ${bgClass} ${
        isSelected ? 'ring-4 ' + ringClass : ''
      }">
            ${isEV ? '<span class="text-[10px]">⚡</span>' : ''}
            <span>${cp.availableLots}</span>
          </div>
          <div class="w-1.5 h-1.5 rounded-full ${
            cp.availableLots === 0
              ? 'bg-rose-600'
              : cp.availableLots < 25
              ? 'bg-amber-600'
              : 'bg-emerald-600'
          } shadow-sm -mt-0.5"></div>
        </button>
      `;

      const customIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html: markerHtml,
        iconSize: [60, 32],
        iconAnchor: [30, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([cp.coordinates.lat, cp.coordinates.lng], {
        icon: customIcon,
      }).addTo(markersLayerRef.current!);

      marker.on('click', () => {
        onSelectCarpark(cp);
      });
    });
  }, [carparks, selectedCarpark, userLocation]);

  // Center on selected carpark
  useEffect(() => {
    if (selectedCarpark && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selectedCarpark.coordinates.lat, selectedCarpark.coordinates.lng],
        15,
        { duration: 1.2 }
      );
    }
  }, [selectedCarpark]);

  const handleZoneJump = (zone: (typeof SG_ZONES)[0]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([zone.lat, zone.lng], zone.zoom, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-10rem)] min-h-[500px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Quick Zone Navigator Chips */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pointer-events-auto">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-xl shadow-md border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
            Zones
          </span>
          {SG_ZONES.map((zone) => (
            <button
              key={zone.name}
              onClick={() => handleZoneJump(zone)}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              {zone.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>&gt; 50 lots</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>15-50 lots</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>&lt; 15 lots</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Zap className="w-3 h-3 text-emerald-500" />
            <span>EV Charging</span>
          </div>
        </div>
      </div>

      {/* Floating GPS Recenter Button */}
      <div className="absolute top-18 right-4 z-10 pointer-events-auto">
        <button
          onClick={onLocateMe}
          title="Zoom to my GPS location"
          className="p-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
        >
          <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </button>
      </div>
    </div>
  );
};
