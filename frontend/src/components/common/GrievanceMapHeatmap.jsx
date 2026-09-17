import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const createColorIcon = (priority) => {
  const colorMap = {
    High: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    Medium: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    Low: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
  };

  return new L.Icon({
    iconUrl: colorMap[priority] || colorMap.Medium,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export const GrievanceMapHeatmap = ({
  grievances = [],
  height = '380px',
  basePath = '/admin/grievances'
}) => {
  const validPoints = grievances.filter(
    (g) => g.latitude && g.longitude && !isNaN(g.latitude) && !isNaN(g.longitude)
  );

  const defaultCenter = validPoints.length > 0
    ? [validPoints[0].latitude, validPoints[0].longitude]
    : [28.6139, 77.2090];

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-glass">
      <div style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {validPoints.map((g) => (
            <Marker
              key={g.id}
              position={[g.latitude, g.longitude]}
              icon={createColorIcon(g.priority)}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[200px] text-slate-900">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs font-bold text-slate-800">{g.category}</span>
                  </div>
                  <h5 className="text-xs font-semibold text-slate-900 line-clamp-2 mb-1.5">
                    {g.title}
                  </h5>
                  <div className="text-[11px] text-slate-600 mb-2">
                    {g.address || `${g.latitude.toFixed(4)}, ${g.longitude.toFixed(4)}`}
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-200">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {g.status}
                    </span>
                    <Link
                      to={`${basePath}/${g.id}`}
                      className="text-[11px] font-medium text-civic-600 hover:text-civic-800 flex items-center gap-0.5"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
