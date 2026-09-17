import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

// Fix default Leaflet icon paths in Vite
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationMarker({ position, setPosition }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? (
    <Marker position={[position.lat, position.lng]} icon={customMarkerIcon} />
  ) : null;
}

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], 14);
    }
  }, [center, map]);
  return null;
}

export const LeafletMapPicker = ({
  latitude,
  longitude,
  onChange,
  height = '280px'
}) => {
  const [position, setPosition] = useState(() => ({
    lat: latitude || 28.6139,
    lng: longitude || 77.2090
  }));
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (latitude && longitude && (latitude !== position.lat || longitude !== position.lng)) {
      setPosition({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const handlePositionChange = (newPos) => {
    setPosition(newPos);
    if (onChange) {
      onChange(Number(newPos.lat.toFixed(5)), Number(newPos.lng.toFixed(5)));
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPos = {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5))
          };
          handlePositionChange(userPos);
          setLocating(false);
        },
        () => {
          setLocating(false);
          // Fallback to default
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-md">
      <div style={{ height }}>
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
          <MapUpdater center={position} />
        </MapContainer>
      </div>

      {/* Floating GPS coordinates bar & Geolocation button */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 p-2 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/80 text-xs z-[400]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          <span>
            Lat: <strong className="text-white">{position.lat.toFixed(4)}</strong>, Lng:{' '}
            <strong className="text-white">{position.lng.toFixed(4)}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={locating}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-civic-600 hover:bg-civic-500 text-white font-medium transition shadow-sm"
        >
          <Navigation className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
          {locating ? 'Detecting...' : 'My Location'}
        </button>
      </div>
    </div>
  );
};
