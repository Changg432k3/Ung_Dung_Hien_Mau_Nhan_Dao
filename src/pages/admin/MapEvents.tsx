import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, Calendar, Clock, Filter, X, Search, 
  Navigation, Info, ChevronLeft, Layers, Map as MapIcon
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useApp, Event } from '../../store/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { VIETNAM_PROVINCES } from '../../constants/provinces';

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

// Custom Marker Icons
const createPinIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="background-color: ${color};">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
        <div class="absolute -bottom-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px]" style="border-t-color: ${color};"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const icons = {
  ongoing: createPinIcon('#ef4444'), // Red
  upcoming: createPinIcon('#3b82f6'), // Blue
  fixed: createPinIcon('#64748b'),    // Gray (Slate 500)
};

const FitBounds = ({ points, savedState }: { points: { lat: number; lng: number }[], savedState: any }) => {
  const map = useMap();
  const [hasRestored, setHasRestored] = useState(false);
  const prevPointsRef = React.useRef(points);

  useEffect(() => {
    const pointsChanged = prevPointsRef.current !== points;
    prevPointsRef.current = points;

    if (savedState && !hasRestored) {
      map.setView([savedState.lat, savedState.lng], savedState.zoom);
      setHasRestored(true);
    } else if (points.length > 0 && (!savedState || (hasRestored && pointsChanged))) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [points, map, savedState, hasRestored]);
  return null;
};

const MapStateTracker = () => {
  const map = useMap();
  useEffect(() => {
    const onMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const state = sessionStorage.getItem('adminMapState');
      let parsedState = {};
      if (state) {
        try {
          parsedState = JSON.parse(state);
        } catch (e) {}
      }
      sessionStorage.setItem('adminMapState', JSON.stringify({ 
        ...parsedState,
        lat: center.lat, 
        lng: center.lng, 
        zoom 
      }));
    };
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
    };
  }, [map]);
  return null;
};

export const AdminMapEvents: React.FC = () => {
  const { events, locations } = useApp();
  const navigate = useNavigate();
  const savedState = useMemo(() => {
    const state = sessionStorage.getItem('adminMapState');
    if (state) {
      try {
        return JSON.parse(state);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  const [searchQuery, setSearchQuery] = useState(savedState?.searchQuery || '');
  const [regionFilter, setRegionFilter] = useState(savedState?.regionFilter || '');
  const [statusFilter, setStatusFilter] = useState(savedState?.statusFilter || 'all');
  const [showFixedPoints, setShowFixedPoints] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  // Update sessionStorage when filters change
  useEffect(() => {
    const state = sessionStorage.getItem('adminMapState');
    let parsedState = {};
    if (state) {
      try {
        parsedState = JSON.parse(state);
      } catch (e) {}
    }
    sessionStorage.setItem('adminMapState', JSON.stringify({
      ...parsedState,
      searchQuery,
      regionFilter,
      statusFilter
    }));
  }, [searchQuery, regionFilter, statusFilter]);

  // Combine events and locations for the map
  const mapPoints = useMemo(() => {
    const points: any[] = [];

    // Add events
    events.forEach(event => {
      if (event.lat && event.lng) {
        points.push({
          ...event,
          mapType: 'event',
          markerType: event.status === 'ongoing' ? 'ongoing' : 'upcoming'
        });
      }
    });

    // Add fixed locations
    if (showFixedPoints) {
      locations.forEach(loc => {
        if (loc.lat && loc.lng) {
          points.push({
            ...loc,
            mapType: 'location',
            markerType: 'fixed',
            title: loc.name // for consistent display
          });
        }
      });
    }

    return points.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = regionFilter ? p.region === regionFilter : true;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'ongoing' && p.status === 'ongoing') ||
                           (statusFilter === 'upcoming' && p.status === 'upcoming') ||
                           (statusFilter === 'fixed' && p.mapType === 'location');
      
      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [events, locations, searchQuery, regionFilter, statusFilter, showFixedPoints]);

  return (
    <div className="h-[calc(100vh-64px)] -m-4 sm:-m-6 lg:-m-8 flex flex-col relative overflow-hidden">
      {/* Header / Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 z-20 flex flex-col sm:flex-row gap-4 items-center shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">Bản đồ sự kiện</h1>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm sự kiện, địa điểm..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select 
              className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="">Tất cả khu vực</option>
              {VIETNAM_PROVINCES.map(p => (
                <option key={`province-${p}`} value={p}>{p}</option>
              ))}
            </select>

            <select 
              className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="fixed">Điểm cố định</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative z-10">
        <MapContainer
          center={[10.762622, 106.660172]}
          zoom={13}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapStateTracker />
          <FitBounds points={mapPoints} savedState={savedState} />

          {mapPoints.map(point => (
            <Marker 
              key={`${point.mapType}-${point.id}`} 
              position={[point.lat, point.lng]}
              icon={icons[point.markerType as keyof typeof icons]}
              eventHandlers={{
                click: () => setSelectedPoint(point),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant={point.mapType === 'location' ? 'outline' : 'default'}
                      className={
                        point.status === 'ongoing' ? 'bg-red-100 text-red-700 border-red-200' :
                        point.status === 'upcoming' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }
                    >
                      {point.mapType === 'location' ? 'Điểm cố định' : 
                       point.status === 'ongoing' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{point.title}</h4>
                  <p className="text-[11px] text-slate-500 flex items-start gap-1 mb-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    {point.address}
                  </p>
                  {point.mapType === 'event' && (
                    <>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {isValid(parseISO(point.date)) ? format(parseISO(point.date), 'dd/MM/yyyy') : point.date}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
                        <Clock className="w-3 h-3 shrink-0" />
                        {point.time}
                      </p>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    className="w-full h-8 text-xs bg-red-600 hover:bg-red-700 text-white mt-1"
                    onClick={() => {
                      if (point.mapType === 'event') {
                        navigate(`/events/${point.id}`);
                      } else {
                        navigate(`/events?locationId=${point.id}`);
                      }
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Legend & Stats */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl max-w-xs hidden sm:block">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-500" />
            Chú thích bản đồ
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm"></div>
                <span className="text-slate-600">Sự kiện đang diễn ra</span>
              </div>
              <span className="font-bold text-slate-900">{events.filter(e => e.status === 'ongoing').length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm"></div>
                <span className="text-slate-600">Sự kiện sắp tới</span>
              </div>
              <span className="font-bold text-slate-900">{events.filter(e => e.status === 'upcoming').length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500 border border-white shadow-sm"></div>
                <span className="text-slate-600">Điểm hiến máu cố định</span>
              </div>
              <span className="font-bold text-slate-900">{locations.length}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tổng số điểm hiển thị</span>
              <span className="text-sm font-black text-red-600">{mapPoints.length}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-1 flex flex-col overflow-hidden">
            <button 
              className="p-3 hover:bg-slate-50 text-slate-600 border-b border-slate-100 transition-colors"
              title="Vị trí của tôi"
              onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  // Recenter map logic would go here if we had a map ref
                });
              }}
            >
              <Navigation className="w-5 h-5" />
            </button>
            <button 
              className="p-3 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Lớp bản đồ"
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
