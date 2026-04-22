import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, increment, setDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { MapPin, Search, Calendar, Navigation, CheckCircle2, ArrowRight, Filter, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { useApp } from '../store/AppContext';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createCustomIcon } from '../lib/mapUtils';
import { Badge } from '../components/ui/Badge';
import { Star, Share2, Heart } from 'lucide-react';

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

const FitBounds = ({ locations }: { locations: Location[] }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [locations, map]);
  return null;
};

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [lat, lng, map]);
  return null;
};

const MapStateSaver = () => {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      sessionStorage.setItem('locations_mapCenter', JSON.stringify([center.lat, center.lng]));
      sessionStorage.setItem('locations_mapZoom', zoom.toString());
    }
  });
  return null;
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  contactInfo?: string;
  type: 'hospital' | 'center' | 'mobile';
  imageUrl?: string;
}

interface FirebaseEvent {
  id: string;
  title: string;
  locationId: string;
  startDate: string;
  endDate: string;
  time: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  registered?: number;
  target?: number;
}

export const LocationsMap: React.FC = () => {
  const { currentUser, events: appEvents } = useApp();
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<FirebaseEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState<string | null>(null);

  const savedCenter = sessionStorage.getItem('locations_mapCenter');
  const savedZoom = sessionStorage.getItem('locations_mapZoom');
  const initialCenter = savedCenter ? JSON.parse(savedCenter) : [10.762622, 106.660172];
  const initialZoom = savedZoom ? parseInt(savedZoom, 10) : 13;

  useEffect(() => {
    const unsubLocs = onSnapshot(query(collection(db, 'locations'), orderBy('name', 'asc')), (snapshot) => {
      const locs: Location[] = [];
      snapshot.forEach((doc) => {
        locs.push({ id: doc.id, ...doc.data() } as Location);
      });
      setLocations(locs);
      setIsLoading(false);
    }, (error) => {
      toast.error("Không thể tải danh sách địa điểm.");
      setIsLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'locations');
    });

    return () => {
      unsubLocs();
    };
  }, []);

  useEffect(() => {
    // Sync appEvents to local events state
    setEvents(appEvents as any[]);
  }, [appEvents]);

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           loc.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || loc.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [locations, searchQuery, selectedType]);

  const getLocationEvents = (locationId: string) => {
    return events.filter(e => e.locationId === locationId && e.status !== 'completed');
  };

  const openGoogleMaps = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const getLocationIcon = (type: string, hasEvents: boolean) => {
    let color = '#64748b'; // default slate
    let icon = '📍';

    if (type === 'hospital') {
      color = '#ef4444'; // red-500
      icon = '🏥';
    } else if (type === 'center') {
      color = '#10b981'; // emerald-500
      icon = '🩸';
    } else if (type === 'mobile') {
      color = '#f59e0b'; // amber-500
      icon = '🚐';
    }

    return createCustomIcon(color, `<span style="font-size: 1.2rem;">${icon}</span>`, hasEvents ? 46 : 40);
  };

  const handleRegister = async (eventId: string) => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để đăng ký hiến máu.");
      return;
    }

    setIsRegistering(eventId);
    try {
      // Use a batch to ensure atomic updates
      const batch = writeBatch(db);
      
      // Create registration record
      const registrationId = `${currentUser.id}_${eventId}`;
      const registrationRef = doc(db, 'registrations', registrationId);
      batch.set(registrationRef, {
        eventId,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        bloodGroup: currentUser.bloodGroup || 'Chưa biết',
        status: 'registered',
        registeredAt: new Date().toISOString()
      });

      // Note: Event registered count is handled in AppContext when record is added
      // We don't need to update it here manually since we use local state now
      
      await batch.commit();

      toast.success("Đăng ký thành công! Cảm ơn bạn đã tham gia hiến máu.");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng ký.");
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
    } finally {
      setIsRegistering(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bản đồ điểm hiến máu</h1>
          <p className="text-slate-600 mt-2">Tìm kiếm các địa điểm và sự kiện hiến máu gần bạn nhất.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        {/* Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm địa điểm..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="flex-1 text-sm border-slate-200 rounded-lg focus:ring-red-500"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">Tất cả loại hình</option>
                <option value="hospital">Bệnh viện</option>
                <option value="center">Trung tâm</option>
                <option value="mobile">Lưu động</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-10 text-slate-500">Đang tải dữ liệu...</div>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-10 text-slate-500">Không tìm thấy địa điểm nào.</div>
            ) : (
              filteredLocations.map(loc => {
                const locEvents = getLocationEvents(loc.id);
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <div 
                    key={loc.id} 
                    className={`p-4 rounded-xl border transition-colors cursor-pointer ${isSelected ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-red-300'}`}
                    onClick={() => setSelectedLocation(loc)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{loc.name}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{loc.address}</p>
                        
                        {locEvents.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200/60">
                            <p className="text-xs font-medium text-slate-700 mb-2">Sự kiện sắp tới:</p>
                            <div className="space-y-2">
                              {locEvents.map(evt => (
                                <div key={evt.id} className="bg-white p-3 rounded-lg border border-slate-100 text-sm flex flex-col gap-2">
                                  <div>
                                    <p className="font-medium text-slate-800">{evt.title}</p>
                                    <p className="text-slate-500 mt-0.5 flex items-center gap-1 text-xs">
                                      <Calendar className="w-3 h-3" /> 
                                      {format(parseISO(evt.startDate), 'dd/MM/yyyy')} • {evt.time}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-slate-500">
                                      {evt.registered || 0} / {evt.target || 0} người
                                    </span>
                                    <Button 
                                      size="sm" 
                                      className="h-7 text-xs px-3 bg-red-50 text-red-600 hover:bg-red-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRegister(evt.id);
                                      }}
                                      disabled={isRegistering === evt.id}
                                    >
                                      {isRegistering === evt.id ? 'Đang xử lý...' : 'Đăng ký'}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="lg:col-span-2 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            className="h-full w-full z-0"
            zoomControl={false}
          >
            <MapStateSaver />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <FitBounds locations={filteredLocations} />
            {selectedLocation && (
              <RecenterMap lat={selectedLocation.lat} lng={selectedLocation.lng} />
            )}

            {filteredLocations.map(loc => {
              const locEvents = getLocationEvents(loc.id);
              return (
                <Marker 
                  key={loc.id} 
                  position={[loc.lat, loc.lng]}
                  icon={getLocationIcon(loc.type, locEvents.length > 0)}
                  eventHandlers={{
                    click: () => setSelectedLocation(loc),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="w-64 overflow-hidden">
                      {loc.imageUrl && (
                        <div className="h-24 w-full relative">
                          <img 
                            src={loc.imageUrl} 
                            alt={loc.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-[10px] py-0 h-4">
                              {loc.type === 'hospital' ? 'Bệnh viện' : loc.type === 'center' ? 'Trung tâm' : 'Lưu động'}
                            </Badge>
                          </div>
                        </div>
                      )}
                      <div className="p-3">
                        <h4 className="font-bold text-slate-900 leading-tight mb-1">{loc.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{loc.address}</p>
                        
                        {locEvents.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sự kiện sắp tới</p>
                            <div className="space-y-1">
                              {locEvents.slice(0, 2).map(evt => (
                                <div key={evt.id} className="text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100 flex justify-between items-center">
                                  <span className="font-medium text-slate-700 truncate mr-2">{evt.title}</span>
                                  <span className="text-red-600 font-bold shrink-0">{format(parseISO(evt.startDate), 'dd/MM')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="h-8 flex-1 text-xs bg-red-600 hover:bg-red-700"
                            onClick={() => setSelectedLocation(loc)}
                          >
                            Chi tiết
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => openGoogleMaps(loc.address)}
                            title="Chỉ đường"
                          >
                            <Navigation className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-1 flex flex-col">
              <button 
                className="p-2 hover:bg-slate-50 text-slate-600 border-b border-slate-100"
                onClick={() => {
                  // This button could be for "My Location" or "Reset View"
                  if (filteredLocations.length > 0) {
                    // The FitBounds component will handle this if we trigger a re-render or just let it be
                  }
                }}
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Overlay for selected location details */}
          {selectedLocation && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-4 max-h-[60%] overflow-y-auto z-[1000]">
              <div className="flex gap-4">
                {selectedLocation.imageUrl ? (
                  <img src={selectedLocation.imageUrl || undefined} alt={selectedLocation.name} className="w-24 h-24 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <MapPin className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-slate-900">{selectedLocation.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                        {selectedLocation.type === 'hospital' ? 'Bệnh viện' : selectedLocation.type === 'center' ? 'Trung tâm' : 'Lưu động'}
                      </span>
                      <button onClick={() => setSelectedLocation(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{selectedLocation.address}</p>
                  {selectedLocation.contactInfo && (
                    <p className="text-sm text-slate-600 mt-1">Liên hệ: {selectedLocation.contactInfo}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                      onClick={() => openGoogleMaps(selectedLocation.address)}
                    >
                      <Navigation className="w-4 h-4" />
                      Chỉ đường
                    </Button>
                    <Link 
                      to={`/events?locationId=${selectedLocation.id}`}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      Xem tất cả sự kiện
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Upcoming Events List */}
              {getLocationEvents(selectedLocation.id).length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-semibold text-sm text-slate-800 mb-3">Các sự kiện sắp diễn ra tại đây:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getLocationEvents(selectedLocation.id).map(evt => (
                      <div key={evt.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
                        <div>
                          <p className="font-medium text-sm text-slate-900 line-clamp-1">{evt.title}</p>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> 
                            {format(parseISO(evt.startDate), 'dd/MM/yyyy')} • {evt.time}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-slate-500">
                            {evt.registered || 0} / {evt.target || 0} đăng ký
                          </span>
                          <Button 
                            size="sm" 
                            className="h-7 text-xs px-3 bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegister(evt.id);
                            }}
                            disabled={isRegistering === evt.id}
                          >
                            {isRegistering === evt.id ? 'Đang xử lý...' : 'Đăng ký'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
