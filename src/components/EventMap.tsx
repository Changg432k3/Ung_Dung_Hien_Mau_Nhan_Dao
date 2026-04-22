import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Fix Leaflet marker icon issue
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Event {
  id: string;
  title: string;
  location: string;
  startDate: string;
  time: string;
  lat?: number;
  lng?: number;
}

interface EventMapProps {
  events: Event[];
  className?: string;
  zoom?: number;
  center?: [number, number];
  interactive?: boolean;
}

const FitBounds = ({ events }: { events: Event[] }) => {
  const map = useMap();
  useEffect(() => {
    const validEvents = events.filter(e => e.lat !== undefined && e.lng !== undefined);
    if (validEvents.length > 0) {
      const bounds = L.latLngBounds(validEvents.map(e => [e.lat!, e.lng!]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [events, map]);
  return null;
};

export const EventMap: React.FC<EventMapProps> = ({ 
  events, 
  className = "h-full w-full", 
  zoom = 13, 
  center = [10.762622, 106.660172],
  interactive = true
}) => {
  const validEvents = events.filter(e => e.lat !== undefined && e.lng !== undefined);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      zoomControl={interactive}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <FitBounds events={validEvents} />

      {validEvents.map(event => (
        <Marker 
          key={event.id} 
          position={[event.lat!, event.lng!]}
        >
          <Popup>
            <div className="p-1 min-w-[180px]">
              <h4 className="font-bold text-slate-900 text-sm">{event.title}</h4>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {event.location}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {format(parseISO(event.startDate), 'dd/MM/yyyy')}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {event.time}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
