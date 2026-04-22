import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Search, Filter, ArrowRight, Heart, X, Clock, Info, Users, ChevronRight, Droplets, RotateCcw } from 'lucide-react';
import { useApp, Event, BloodGroup } from '../store/AppContext';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const PublicEvents: React.FC = () => {
  const { events, userLocation, calculateDistance } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'urgent' | 'routine'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Advanced Filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState<BloodGroup | ''>('');

  // Extract unique locations for the filter
  const locations = useMemo(() => {
    const locs = new Set<string>();
    events.forEach(e => {
      if (e.region) locs.add(e.region);
      else if (e.location) locs.add(e.location);
    });
    return Array.from(locs).sort();
  }, [events]);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'urgent' && event.category === 'urgent') ||
                         (filter === 'routine' && event.category === 'routine');
    
    const matchesDate = !selectedDate || event.date === selectedDate;
    
    const matchesLocation = !selectedLocation || 
                           event.region === selectedLocation || 
                           event.location === selectedLocation;
    
    const matchesBloodType = !selectedBloodType || 
                            (event.neededBloodTypes && event.neededBloodTypes.includes(selectedBloodType as BloodGroup));

    return matchesSearch && matchesFilter && matchesDate && matchesLocation && matchesBloodType && (event.status === 'upcoming' || event.status === 'ongoing');
  });

  const resetFilters = () => {
    setSearchTerm('');
    setFilter('all');
    setSelectedDate('');
    setSelectedLocation('');
    setSelectedBloodType('');
  };

  return (
    <div className="pb-20">
      {/* Header Section */}
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6"
            >
              <Calendar className="w-3 h-3" /> Sự kiện hiến máu
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-slate-900 mb-6"
            >
              Tìm kiếm sự kiện hiến máu <br />
              <span className="text-red-600">Gần bạn nhất</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-600 leading-relaxed"
            >
              Hàng trăm sự kiện hiến máu được tổ chức mỗi tháng trên khắp cả nước. Hãy chọn một địa điểm thuận tiện và đăng ký tham gia ngay hôm nay.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Tìm kiếm sự kiện, địa điểm, địa chỉ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white shadow-sm transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'urgent', label: 'Khẩn cấp' },
                { id: 'routine', label: 'Định kỳ' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id as any)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    filter === item.id 
                      ? 'bg-slate-900 text-white shadow-lg' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Button 
                variant="outline" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`rounded-xl px-4 ${showAdvanced ? 'bg-slate-100 border-slate-400' : ''}`}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 pb-4 border-t border-slate-100 mt-2">
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
                      <MapPin className="w-3 h-3" /> Khu vực / Địa điểm
                    </label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm appearance-none"
                    >
                      <option value="">Tất cả khu vực</option>
                      {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplets className="w-3 h-3" /> Nhóm máu cần thiết
                    </label>
                    <select
                      value={selectedBloodType}
                      onChange={(e) => setSelectedBloodType(e.target.value as BloodGroup)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm appearance-none"
                    >
                      <option value="">Tất cả nhóm máu</option>
                      {bloodGroups.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pb-4">
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
        </div>
      </section>

      {/* Events Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">
            {filteredEvents.length} sự kiện phù hợp
          </h2>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedEvent(event)}
                className="cursor-pointer"
              >
                <Card className="overflow-hidden border-slate-200/60 hover:shadow-xl transition-all group h-full flex flex-col">
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={event.imageUrl || `https://picsum.photos/seed/${event.id}/600/400`} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                      <Badge variant={event.status === 'upcoming' ? 'info' : event.status === 'ongoing' ? 'success' : 'secondary'} className="border-none shadow-sm">
                        {event.status === 'upcoming' ? 'Sắp diễn ra' : event.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                      </Badge>
                      <Badge variant={event.category === 'urgent' ? 'default' : 'info'} className="border-none shadow-sm">
                        {event.category === 'urgent' ? 'Khẩn cấp' : 'Định kỳ'}
                      </Badge>
                      {event.neededBloodTypes && (
                        <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                          {event.neededBloodTypes.slice(0, 3).map((bg, index) => (
                            <Badge className="bg-white/90 text-red-600 border-none text-[10px] px-1.5 h-5 backdrop-blur-sm">
                              {bg}
                            </Badge>
                          ))}
                          {event.neededBloodTypes.length > 3 && (
                            <Badge className="bg-white/90 text-red-600 border-none text-[10px] px-1.5 h-5 backdrop-blur-sm">
                              +{event.neededBloodTypes.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-3 font-medium">
                      <Calendar className="w-4 h-4" /> {event.date}
                    </div>
                    <h3 className="font-bold text-xl text-slate-900 mb-3 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex items-start gap-2 text-slate-600 text-sm mb-6 flex-1">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="line-clamp-2">{event.location}</span>
                        {userLocation && event.lat && event.lng && (
                          <span className="text-xs text-red-600 font-semibold mt-1">
                            Cách bạn ~{calculateDistance(userLocation.lat, userLocation.lng, event.lat, event.lng).toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-400">Xem chi tiết</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-6">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy sự kiện phù hợp</h3>
            <p className="text-slate-500 mb-8">Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc.</p>
            <Button variant="outline" onClick={resetFilters} className="rounded-xl">
              <RotateCcw className="w-4 h-4 mr-2" /> Đặt lại tất cả bộ lọc
            </Button>
          </div>
        )}
      </section>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="h-64 shrink-0 relative">
                <img 
                  src={selectedEvent.imageUrl || `https://picsum.photos/seed/${selectedEvent.id}/800/600`} 
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-8 right-8">
                  <div className="flex gap-2 mb-3">
                    <Badge variant={selectedEvent.status === 'upcoming' ? 'info' : selectedEvent.status === 'ongoing' ? 'success' : 'secondary'} className="border-none">
                      {selectedEvent.status === 'upcoming' ? 'Sắp diễn ra' : selectedEvent.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                    </Badge>
                    <Badge variant={selectedEvent.category === 'urgent' ? 'default' : 'info'} className="border-none">
                      {selectedEvent.category === 'urgent' ? 'Khẩn cấp' : 'Định kỳ'}
                    </Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {selectedEvent.title}
                  </h2>
                </div>
              </div>

              <div className="p-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ngày tổ chức</p>
                      <p className="font-bold text-slate-900">{selectedEvent.date}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Thời gian</p>
                      <p className="font-bold text-slate-900">{selectedEvent.time}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 md:col-span-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Địa điểm</p>
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-bold text-slate-900">{selectedEvent.location}</p>
                        {userLocation && selectedEvent.lat && selectedEvent.lng && (
                          <Badge variant="outline" className="text-red-600 border-red-100 bg-red-50 shrink-0">
                            Cách bạn ~{calculateDistance(userLocation.lat, userLocation.lng, selectedEvent.lat, selectedEvent.lng).toFixed(1)} km
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{selectedEvent.address}</p>
                    </div>
                  </div>
                  {selectedEvent.neededBloodTypes && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nhóm máu cần thiết</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedEvent.neededBloodTypes.map((bg, index) => (
                            <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100">
                              {bg}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6 mb-8">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Users className="w-4 h-4 text-red-500" />
                        Tiến độ đăng ký
                      </div>
                      <span className="text-sm font-bold text-red-600">
                        {selectedEvent.registered}/{selectedEvent.target} người
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(selectedEvent.registered / selectedEvent.target) * 100}%` }}
                        className="h-full bg-red-600"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">
                      <strong>Lưu ý:</strong> Để đăng ký tham gia sự kiện này, bạn cần đăng nhập vào hệ thống Máu+ để chúng tôi có thể quản lý hồ sơ sức khỏe và tích điểm cho bạn.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="flex-1 rounded-2xl py-7 text-lg font-bold shadow-lg shadow-red-200"
                    onClick={() => navigate('/login')}
                  >
                    Đăng nhập để đăng ký
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-2xl py-7 text-lg font-bold"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 mt-12">
        <div className="bg-red-600 rounded-[2.5rem] p-8 md:p-16 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-1 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bạn là đơn vị tổ chức?</h2>
            <p className="text-red-100 text-lg mb-10">Hãy đăng ký tài khoản Ban tổ chức để có thể tạo và quản lý các sự kiện hiến máu trên nền tảng Máu+.</p>
            <Button size="lg" variant="secondary" className="rounded-full px-10 h-14 text-base" onClick={() => navigate('/login')}>
              Đăng ký tổ chức sự kiện <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
