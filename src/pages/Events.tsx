import React, { useState, useEffect } from 'react';
import { useApp, BloodGroup } from '../store/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Calendar, MapPin, Search, Filter, Grid, Map as MapIcon, Navigation, Star, Share2, CheckCircle2, Heart, ChevronLeft, ChevronRight, Clock, Users, ArrowRight, Droplets, RotateCcw } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { createCustomIcon } from '../lib/mapUtils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  parseISO, 
  isValid,
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays,
  isToday,
  startOfDay,
  endOfDay,
  isWithinInterval
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { FeaturedEventCard } from '../components/FeaturedEventCard';
import { EventCard } from '../components/EventCard';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapStateSaver = () => {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      sessionStorage.setItem('events_mapCenter', JSON.stringify([center.lat, center.lng]));
      sessionStorage.setItem('events_mapZoom', zoom.toString());
    }
  });
  return null;
};

export const Events: React.FC = () => {
  const { events, userLocation, calculateDistance, currentUser, records, cancelRegistration, reviews, toggleInterestedEvent, locations } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'routine' | 'urgent' | 'special'>('all');
  const [filterLocation, setFilterLocation] = useState<string>(searchParams.get('locationId') || 'all');
  const [sortBy, setSortBy] = useState<'date' | 'distance'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'calendar'>(() => {
    return (sessionStorage.getItem('events_viewMode') as any) || 'grid';
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState<BloodGroup | ''>('');

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    sessionStorage.setItem('events_viewMode', viewMode);
  }, [viewMode]);
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('month');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; recordId: string; eventTitle: string }>({
    isOpen: false,
    recordId: '',
    eventTitle: ''
  });

  const getEventIcon = (status: string, category: string) => {
    let color = '#64748b'; // default slate
    let icon = '📅';

    if (status === 'ongoing') {
      color = '#10b981'; // success
      icon = '🩸';
    } else if (status === 'upcoming') {
      color = '#3b82f6'; // info
      icon = category === 'urgent' ? '🚨' : '📅';
    } else {
      color = '#94a3b8'; // secondary
      icon = '✅';
    }

    return createCustomIcon(color, `<span style="font-size: 1.2rem;">${icon}</span>`, status === 'ongoing' ? 46 : 40);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    const matchesLocation = filterLocation === 'all' || event.locationId === filterLocation || event.location === filterLocation;
    const matchesDate = !selectedDate || event.date === selectedDate;
    const matchesBloodType = !selectedBloodType || (event.neededBloodTypes && event.neededBloodTypes.includes(selectedBloodType));
    
    return matchesSearch && matchesStatus && matchesCategory && matchesLocation && matchesDate && matchesBloodType;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'distance' && userLocation) {
      const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return distA - distB;
    }
    return 0;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterLocation('all');
    setSortBy('date');
    setSelectedDate('');
    setSelectedBloodType('');
  };

  // Calculate center of the map based on filtered events
  const defaultCenter: [number, number] = [10.7769, 106.7009]; // Default to TP.HCM
  const savedCenter = sessionStorage.getItem('events_mapCenter');
  const savedZoom = sessionStorage.getItem('events_mapZoom');

  const mapCenter = savedCenter ? JSON.parse(savedCenter) : (filteredEvents.length > 0 && filteredEvents[0].lat && filteredEvents[0].lng
    ? [filteredEvents[0].lat, filteredEvents[0].lng] as [number, number]
    : defaultCenter);
  
  const mapZoom = savedZoom ? parseInt(savedZoom, 10) : 13;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sự kiện hiến máu</h1>
          <p className="text-slate-500 mt-2">Tìm kiếm và đăng ký tham gia các sự kiện gần bạn.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" /> Danh sách
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="w-4 h-4" /> Bản đồ
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="w-4 h-4" /> Lịch
          </button>
        </div>
      </div>

      {/* Featured Event */}
      <FeaturedEventCard />

      {/* Filters */}
      <Card className="shadow-sm border-slate-200/60 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo tên sự kiện, địa điểm, địa chỉ..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select 
                className="py-2.5 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-sm shadow-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="upcoming">Sắp diễn ra</option>
                <option value="ongoing">Đang diễn ra</option>
                <option value="completed">Đã kết thúc</option>
              </select>
              <select 
                className="py-2.5 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-sm shadow-sm"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <option value="all">Tất cả điểm hiến máu</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <Button 
                variant="outline" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`rounded-xl px-4 py-2.5 h-auto ${showAdvanced ? 'bg-slate-100 border-slate-400' : ''}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Lọc nâng cao
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 pb-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Filter className="w-3 h-3" /> Loại sự kiện
                    </label>
                    <select 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as any)}
                    >
                      <option value="all">Tất cả loại</option>
                      <option value="routine">Định kỳ</option>
                      <option value="urgent">Khẩn cấp</option>
                      <option value="special">Đặc biệt</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> Ngày tổ chức
                    </label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplets className="w-3 h-3" /> Nhóm máu cần thiết
                    </label>
                    <select
                      value={selectedBloodType}
                      onChange={(e) => setSelectedBloodType(e.target.value as BloodGroup)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                    >
                      <option value="">Tất cả nhóm máu</option>
                      {bloodGroups.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3" /> Sắp xếp theo
                    </label>
                    <select 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="date">Ngày (Sắp tới trước)</option>
                      {userLocation && <option value="distance">Khoảng cách (Gần nhất trước)</option>}
                    </select>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    Tìm thấy <span className="font-bold text-slate-900">{filteredEvents.length}</span> sự kiện phù hợp
                  </p>
                  <button 
                    onClick={resetFilters}
                    className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Đặt lại bộ lọc
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {viewMode === 'grid' ? (
        /* Events Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => {
              const userRecords = currentUser ? records.filter(r => r.eventId === event.id && r.userId === currentUser.id).sort((a,b) => b.id.localeCompare(a.id)) : [];
              const userRecord = userRecords.length > 0 ? userRecords[0] : null;
              const hasRegistered = userRecord && userRecord.status !== 'cancelled';
              const isInterested = currentUser?.interestedEvents?.includes(event.id);
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  userRecord={userRecord}
                  isInterested={isInterested}
                  reviews={reviews}
                  userLocation={userLocation}
                  calculateDistance={calculateDistance}
                  toggleInterestedEvent={toggleInterestedEvent}
                  onCancelRegistration={(recordId, eventTitle) => {
                    setConfirmModal({
                      isOpen: true,
                      recordId,
                      eventTitle
                    });
                  }}
                />
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-900">Không tìm thấy sự kiện nào</p>
              <p>Vui lòng thử lại với từ khóa khác hoặc thay đổi bộ lọc.</p>
            </div>
          )}
        </div>
      ) : viewMode === 'map' ? (
        /* Map View */
        <Card className="shadow-sm overflow-hidden h-[600px] relative z-0">
          <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={false} className="w-full h-full">
            <MapStateSaver />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MarkerClusterGroup
              chunkedLoading
            >
              {filteredEvents.map(event => {
                const userRecords = currentUser ? records.filter(r => r.eventId === event.id && r.userId === currentUser.id).sort((a,b) => b.id.localeCompare(a.id)) : [];
                const userRecord = userRecords.length > 0 ? userRecords[0] : null;
                const hasRegistered = userRecord && userRecord.status !== 'cancelled';
                const canCancel = hasRegistered && userRecord && (userRecord.status === 'registered' || userRecord.status === 'checked-in');
                const isInterested = currentUser?.interestedEvents?.includes(event.id);

                if (!event.lat || !event.lng) return null;
                return (
                  <Marker 
                    key={event.id} 
                    position={[event.lat, event.lng]}
                    icon={getEventIcon(event.status, event.category)}
                  >
                    <Popup className="rounded-xl overflow-hidden p-0 custom-popup">
                      <div className="w-64 sm:w-72 flex flex-col -m-[13px] sm:-m-[14px]">
                        <div className="h-32 w-full relative">
                          <img 
                            src={event.imageUrl || `https://picsum.photos/seed/${event.id}/400/200`} 
                            alt={event.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            <Badge variant={event.status === 'upcoming' ? 'info' : event.status === 'ongoing' ? 'success' : 'secondary'} className="shadow-sm">
                              {event.status === 'upcoming' ? 'Sắp diễn ra' : event.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                            </Badge>
                            {hasRegistered && userRecord && (
                              <Badge 
                                variant={userRecord.status === 'completed' ? 'success' : userRecord.status === 'checked-in' ? 'default' : 'warning'}
                                className="shadow-sm"
                              >
                                {userRecord.status === 'completed' ? 'Đã hoàn thành' : userRecord.status === 'checked-in' ? 'Đã check-in' : 'Đã đăng ký'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="mb-1 flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] py-0 h-4 bg-white">
                              {event.category === 'urgent' ? 'Khẩn cấp' : event.category === 'special' ? 'Đặc biệt' : 'Định kỳ'}
                            </Badge>
                            {reviews.filter(r => r.eventId === event.id).length > 0 && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 bg-white flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                {(reviews.filter(r => r.eventId === event.id).reduce((acc, curr) => acc + curr.rating, 0) / reviews.filter(r => r.eventId === event.id).length).toFixed(1)}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 leading-tight mb-1 text-sm">{event.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                            <Calendar className="w-3 h-3 text-red-500" /> 
                            {event.startDate && event.endDate && event.startDate !== event.endDate 
                              ? `${isValid(parseISO(event.startDate)) ? format(parseISO(event.startDate), 'dd/MM') : event.startDate} - ${isValid(parseISO(event.endDate)) ? format(parseISO(event.endDate), 'dd/MM/yyyy') : event.endDate}`
                              : (isValid(parseISO(event.date)) ? format(parseISO(event.date), 'dd/MM/yyyy') : event.date)
                            }
                          </div>
                          <p className="text-xs text-slate-500 mb-3 line-clamp-1">{event.address}</p>
                          
                          {userLocation && (
                            <p className="text-xs text-blue-600 mb-3 flex items-center gap-1">
                              <Navigation className="w-3 h-3" /> Cách bạn {calculateDistance(userLocation.lat, userLocation.lng, event.lat, event.lng)} km
                            </p>
                          )}

                          <div className="bg-slate-50 rounded p-2 mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500">Đăng ký</span>
                              <span className="font-medium">{event.registered}/{event.target}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div 
                                className={`h-full rounded-full ${event.registered >= event.target ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                style={{ width: `${Math.min(100, (event.registered / event.target) * 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 mb-2">
                            <Button size="sm" variant="outline" className="h-8 text-xs px-0" asChild title="Chỉ đường">
                              <a 
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Navigation className="w-3 h-3" />
                              </a>
                            </Button>

                            {event.locationId && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 text-xs px-0" 
                                title="Lọc theo địa điểm này"
                                onClick={() => setFilterLocation(event.locationId!)}
                              >
                                <Filter className="w-3 h-3" />
                              </Button>
                            )}

                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs px-0"
                              title="Chia sẻ"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (navigator.share) {
                                  navigator.share({
                                    title: event.title,
                                    text: event.description,
                                    url: window.location.origin + `/events/${event.id}`
                                  }).catch(console.error);
                                } else {
                                  navigator.clipboard.writeText(window.location.origin + `/events/${event.id}`);
                                  toast.success('Đã sao chép liên kết sự kiện vào bộ nhớ tạm!');
                                }
                              }}
                            >
                              <Share2 className="w-3 h-3" />
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className={`h-8 text-xs px-0 ${isInterested ? 'text-red-500' : ''}`}
                              title="Quan tâm"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleInterestedEvent(event.id);
                              }}
                            >
                              <Heart className={`w-3 h-3 ${isInterested ? 'fill-current' : ''}`} />
                            </Button>
                            
                            {canCancel ? (
                              <Button 
                                size="sm"
                                variant="outline" 
                                className="h-8 text-xs px-0 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setConfirmModal({
                                    isOpen: true,
                                    recordId: userRecord.id,
                                    eventTitle: event.title
                                  });
                                }}
                              >
                                Hủy
                              </Button>
                            ) : !hasRegistered && event.status !== 'completed' ? (
                              <Button 
                                size="sm"
                                variant="default" 
                                className="h-8 text-xs px-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/events/${event.id}`);
                                }}
                              >
                                Đăng ký
                              </Button>
                            ) : (
                              <Button className="h-8 text-xs px-0" variant={event.status === 'completed' ? 'secondary' : 'default'} disabled={event.status === 'completed'} asChild={event.status !== 'completed'}>
                                {event.status === 'completed' ? (
                                  <span>Kết thúc</span>
                                ) : (
                                  <Link to={`/events/${event.id}`}>
                                    Chi tiết
                                  </Link>
                                )}
                              </Button>
                            )}
                          </div>

                          {reviews.filter(r => r.eventId === event.id).length > 0 && (
                            <Button 
                              size="sm"
                              variant="ghost" 
                              className="w-full h-7 text-[10px] text-slate-500 hover:text-red-600 hover:bg-red-50 flex items-center justify-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/events/${event.id}`);
                              }}
                            >
                              <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                              Xem {reviews.filter(r => r.eventId === event.id).length} đánh giá
                            </Button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>
        </Card>
      ) : (
        /* Calendar View */
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-600"
                    onClick={() => {
                      if (calendarView === 'month') setCurrentDate(subMonths(currentDate, 1));
                      if (calendarView === 'week') setCurrentDate(subWeeks(currentDate, 1));
                      if (calendarView === 'day') setCurrentDate(subDays(currentDate, 1));
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-8 px-3 text-sm font-medium text-slate-700"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Hôm nay
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-600"
                    onClick={() => {
                      if (calendarView === 'month') setCurrentDate(addMonths(currentDate, 1));
                      if (calendarView === 'week') setCurrentDate(addWeeks(currentDate, 1));
                      if (calendarView === 'day') setCurrentDate(addDays(currentDate, 1));
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <h2 className="text-lg font-bold text-slate-900 capitalize">
                  {format(currentDate, calendarView === 'month' ? 'MMMM yyyy' : 'dd MMMM yyyy', { locale: vi })}
                </h2>
              </div>
              <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${calendarView === 'day' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-slate-900'}`}
                  onClick={() => setCalendarView('day')}
                >
                  Ngày
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${calendarView === 'week' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-slate-900'}`}
                  onClick={() => setCalendarView('week')}
                >
                  Tuần
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${calendarView === 'month' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:text-slate-900'}`}
                  onClick={() => setCalendarView('month')}
                >
                  Tháng
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {calendarView === 'month' && (
              <div className="grid grid-cols-7 border-b border-slate-100">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30">
                    {day}
                  </div>
                ))}
                {(() => {
                  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
                  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
                  const days = eachDayOfInterval({ start, end });

                  return days.map((day) => {
                    const dayEvents = filteredEvents.filter(event => isValid(parseISO(event.date)) && isSameDay(parseISO(event.date), day));
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    
                    return (
                      <div 
                        key={day.toISOString()} 
                        className={`min-h-[120px] p-2 border-r border-b border-slate-100 transition-colors cursor-pointer hover:bg-slate-50/80 ${!isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'} ${isToday(day) ? 'bg-red-50/20' : ''}`}
                        onClick={() => {
                          setCurrentDate(day);
                          setCalendarView('day');
                        }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full ${isToday(day) ? 'bg-red-600 text-white shadow-sm' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                            {format(day, 'd')}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <div 
                              key={event.id}
                              className={`text-[10px] p-1.5 rounded border leading-tight cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm truncate flex flex-col ${
                                event.category === 'urgent' ? 'bg-red-50 text-red-700 border-red-100' : 
                                event.category === 'special' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                                'bg-blue-50 text-blue-700 border-blue-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/events/${event.id}`);
                              }}
                              title={event.title}
                            >
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${event.status === 'upcoming' ? 'bg-blue-500' : event.status === 'ongoing' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <div className="font-bold truncate">{event.title}</div>
                              </div>
                              <div className="flex items-center gap-1 opacity-70 mt-0.5">
                                <Clock className="w-2.5 h-2.5" /> {event.time}
                              </div>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <button 
                              className="text-[10px] text-slate-400 font-medium hover:text-red-600 w-full text-center py-1"
                              onClick={() => {
                                setCurrentDate(day);
                                setCalendarView('day');
                              }}
                            >
                              + {dayEvents.length - 3} sự kiện khác
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {calendarView === 'week' && (
              <div className="flex flex-col">
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
                  {eachDayOfInterval({
                    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                    end: endOfWeek(currentDate, { weekStartsOn: 1 })
                  }).map((day) => (
                    <div key={day.toISOString()} className={`py-4 text-center border-r border-slate-100 last:border-r-0 ${isToday(day) ? 'bg-red-50/30' : ''}`}>
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">
                        {format(day, 'EEEE', { locale: vi })}
                      </div>
                      <div className={`text-xl font-bold inline-flex items-center justify-center w-10 h-10 rounded-full ${isToday(day) ? 'bg-red-600 text-white shadow-md' : 'text-slate-700'}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 min-h-[400px]">
                  {eachDayOfInterval({
                    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                    end: endOfWeek(currentDate, { weekStartsOn: 1 })
                  }).map((day) => {
                    const dayEvents = filteredEvents.filter(event => isValid(parseISO(event.date)) && isSameDay(parseISO(event.date), day));
                    return (
                      <div key={day.toISOString()} className={`p-3 border-r border-slate-100 last:border-r-0 space-y-3 ${isToday(day) ? 'bg-red-50/10' : ''}`}>
                        {dayEvents.map(event => (
                          <Card 
                            key={event.id} 
                            className="p-3 cursor-pointer hover:shadow-md transition-all border-slate-200 group"
                            onClick={() => navigate(`/events/${event.id}`)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline" className="text-[10px] py-0 h-4 uppercase tracking-wider">
                                {event.time}
                              </Badge>
                              <Badge variant={event.status === 'upcoming' ? 'info' : event.status === 'ongoing' ? 'success' : 'secondary'} className="text-[9px] py-0 h-4 px-1">
                                {event.status === 'upcoming' ? 'Sắp' : event.status === 'ongoing' ? 'Đang' : 'Xong'}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-2 leading-snug">
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          </Card>
                        ))}
                        {dayEvents.length === 0 && (
                          <div className="h-full flex items-center justify-center text-slate-300 italic text-xs py-12">
                            Không có sự kiện
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {calendarView === 'day' && (
              <div className="p-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex flex-col items-center justify-center shadow-lg shadow-red-200">
                      <span className="text-xs font-bold uppercase opacity-80">{format(currentDate, 'MMM', { locale: vi })}</span>
                      <span className="text-2xl font-black">{format(currentDate, 'd')}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{format(currentDate, 'EEEE', { locale: vi })}</h3>
                      <p className="text-slate-500">{format(currentDate, 'dd MMMM yyyy', { locale: vi })}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="px-4 py-1.5 text-slate-600 bg-slate-50 border-slate-200">
                    {filteredEvents.filter(e => isValid(parseISO(e.date)) && isSameDay(parseISO(e.date), currentDate)).length} Sự kiện
                  </Badge>
                </div>

                <div className="space-y-6">
                  {filteredEvents.filter(e => isValid(parseISO(e.date)) && isSameDay(parseISO(e.date), currentDate)).length > 0 ? (
                    filteredEvents.filter(e => isValid(parseISO(e.date)) && isSameDay(parseISO(e.date), currentDate)).map(event => {
                      const userRecords = currentUser ? records.filter(r => r.eventId === event.id && r.userId === currentUser.id).sort((a,b) => b.id.localeCompare(a.id)) : [];
                      const userRecord = userRecords.length > 0 ? userRecords[0] : null;
                      const hasRegistered = userRecord && userRecord.status !== 'cancelled';
                      const canCancel = hasRegistered && userRecord && (userRecord.status === 'registered' || userRecord.status === 'checked-in');

                      return (
                        <div key={event.id} className="w-full max-w-2xl">
                          <EventCard
                            event={event}
                            userRecord={userRecord}
                            isInterested={currentUser?.interestedEvents?.includes(event.id)}
                            reviews={reviews}
                            userLocation={userLocation}
                            calculateDistance={calculateDistance}
                            toggleInterestedEvent={toggleInterestedEvent}
                            onCancelRegistration={(recordId, eventTitle) => {
                              setConfirmModal({
                                isOpen: true,
                                recordId,
                                eventTitle
                              });
                            }}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <h4 className="text-xl font-bold text-slate-900 mb-2">Hôm nay không có sự kiện</h4>
                      <p className="text-slate-500 max-w-xs mx-auto">Hãy kiểm tra các ngày khác hoặc quay lại danh sách để xem tất cả sự kiện.</p>
                      <Button 
                        variant="outline" 
                        className="mt-6 border-slate-200"
                        onClick={() => setCalendarView('month')}
                      >
                        Quay lại lịch tháng
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          cancelRegistration(confirmModal.recordId);
          toast.success(`Đã hủy đăng ký sự kiện "${confirmModal.eventTitle}"`);
        }}
        title="Xác nhận hủy đăng ký"
        description={`Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện "${confirmModal.eventTitle}"? Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận hủy"
        cancelText="Quay lại"
        variant="danger"
      />
    </div>
  );
};
