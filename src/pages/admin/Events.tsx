import React, { useState, useMemo } from 'react';
import { useApp, Event } from '../../store/AppContext';
import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { 
  Edit, Trash2, MapPin, Users, Calendar, MoreVertical, 
  Plus, Copy, FileText, Image as ImageIcon, Clock, 
  CheckCircle, X, Search, Filter, Globe, ExternalLink,
  QrCode, List, BarChart2, Save, ScanLine, Heart, Droplet, LayoutGrid, Table
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { VIETNAM_PROVINCES } from '../../constants/provinces';
import { motion, AnimatePresence } from 'motion/react';
import { safeGetTime } from '../../lib/dateUtils';

import { ConfirmationModal } from '../../components/ConfirmationModal';

export const AdminEvents: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent, locations, records } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const getEventExpectedAmount = (eventId: string) => {
    const eventRecords = records.filter(r => r.eventId === eventId && r.status !== 'cancelled');
    return eventRecords.reduce((sum, r) => sum + (r.expectedAmount || 250), 0);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           e.address.toLowerCase().includes(searchQuery.toLowerCase());
      const eventRegion = e.region || 'TP. Hồ Chí Minh';
      const matchesRegion = regionFilter ? eventRegion === regionFilter : true;
      const matchesStatus = statusFilter ? e.status === statusFilter : true;
      const matchesLocation = locationFilter ? (e.locationId === locationFilter || e.location === locationFilter) : true;
      return matchesSearch && matchesRegion && matchesStatus && matchesLocation;
    }).sort((a, b) => safeGetTime(b.startDate) - safeGetTime(a.startDate));
  }, [events, searchQuery, regionFilter, statusFilter, locationFilter]);

  const handleOpenModal = (event?: Event) => {
    if (event) {
      navigate(`/admin/events/${event.id}`);
    } else {
      navigate('/admin/events/new');
    }
  };

  const handleDuplicate = (event: Event) => {
    const { id, registered, status, ...rest } = event;
    addEvent({
      ...rest,
      title: `${rest.title} (Bản sao)`,
      date: format(new Date(), 'yyyy-MM-dd'),
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleSaveTemplate = (event: Event) => {
    // Simulate saving as template
    alert(`Đã lưu sự kiện "${event.title}" làm mẫu (Template) thành công!`);
  };

  const handleOpenQrScanner = (event: Event) => {
    setActiveEvent(event);
    setIsQrModalOpen(true);
  };

  const handleOpenStats = (event: Event) => {
    setActiveEvent(event);
    setIsStatsModalOpen(true);
  };

  const confirmDelete = (id: string) => {
    setEventToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete);
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quản lý sự kiện</h1>
          <p className="text-slate-500 mt-2">Thêm, sửa, xóa và quản lý các sự kiện hiến máu.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
            <button 
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setViewMode('table')}
            >
              <Table className="w-4 h-4" />
              Bảng
            </button>
            <button 
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
              Lưới
            </button>
          </div>
          <Button onClick={() => handleOpenModal()} className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm shadow-red-200 flex items-center gap-2 px-5">
            <Plus className="w-5 h-5" />
            Thêm sự kiện
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm sự kiện, địa điểm, địa chỉ..." 
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col md:flex-row flex-wrap gap-4">
          <select 
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 hover:bg-white transition-colors flex-1 min-w-[180px]"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="">Tất cả tỉnh thành</option>
            {VIETNAM_PROVINCES.map(r => <option key={`province-${r}`} value={r}>{r}</option>)}
          </select>
          <select 
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 hover:bg-white transition-colors flex-1 min-w-[160px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="ongoing">Đang diễn ra</option>
            <option value="completed">Đã kết thúc</option>
          </select>
          <select 
            className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 hover:bg-white transition-colors flex-1 min-w-[200px]"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">Tất cả điểm hiến máu</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div 
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-bold tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-5">Tên sự kiện</th>
                    <th scope="col" className="px-6 py-5">Thời gian</th>
                    <th scope="col" className="px-6 py-5">Khu vực</th>
                    <th scope="col" className="px-6 py-5">Trạng thái</th>
                    <th scope="col" className="px-6 py-5">Đăng ký</th>
                    <th scope="col" className="px-6 py-5">Dự kiến</th>
                    <th scope="col" className="px-6 py-5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="bg-white hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => navigate(`/admin/events/${event.id}`)}>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                            <img 
                              src={event.imageUrl || 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=100&h=100'} 
                              alt={event.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="truncate max-w-[200px] font-bold text-slate-800">{event.title}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-semibold">
                            {event.startDate && event.endDate && event.startDate !== event.endDate 
                              ? `${isValid(parseISO(event.startDate)) ? format(parseISO(event.startDate), 'dd/MM') : event.startDate} - ${isValid(parseISO(event.endDate)) ? format(parseISO(event.endDate), 'dd/MM/yyyy') : event.endDate}`
                              : (isValid(parseISO(event.date)) ? format(parseISO(event.date), 'dd/MM/yyyy', { locale: vi }) : event.date)
                            }
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {event.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {event.region || 'TP. Hồ Chí Minh'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                          event.status === 'upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          event.status === 'ongoing' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {event.status === 'upcoming' ? 'Sắp diễn ra' : event.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, (event.registered / event.target) * 100)}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-slate-700">{event.registered}/{event.target}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                          {(getEventExpectedAmount(event.id) / 1000).toFixed(1)}L
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenStats(event); }}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                            title="Thống kê"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenQrScanner(event); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            title="Check-in QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(event); }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); confirmDelete(event.id); }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredEvents.map((event, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={event.id} 
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group" 
                onClick={() => navigate(`/admin/events/${event.id}`)}
              >
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={event.imageUrl || 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=400&h=200'} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                      event.status === 'upcoming' ? 'bg-blue-500/90 text-white' : 
                      event.status === 'ongoing' ? 'bg-emerald-500/90 text-white' : 
                      'bg-slate-800/90 text-white'
                    }`}>
                      {event.status === 'upcoming' ? 'Sắp diễn ra' : event.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-bold text-white text-xl line-clamp-2 leading-tight">{event.title}</h3>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm text-slate-500"><Calendar className="w-4 h-4" /></div>
                      <span className="font-medium text-slate-700">
                        {event.startDate && event.endDate && event.startDate !== event.endDate 
                          ? `${isValid(parseISO(event.startDate)) ? format(parseISO(event.startDate), 'dd/MM') : event.startDate} - ${isValid(parseISO(event.endDate)) ? format(parseISO(event.endDate), 'dd/MM/yyyy') : event.endDate}`
                          : (isValid(parseISO(event.date)) ? format(parseISO(event.date), 'dd/MM/yyyy', { locale: vi }) : event.date)
                        } • {event.time}
                      </span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 mt-0.5"><MapPin className="w-4 h-4" /></div>
                      <div className="flex flex-col justify-center">
                        <span className="line-clamp-2 font-medium text-slate-700">{event.location}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-500">Đăng ký: <strong className="text-slate-900">{event.registered}/{event.target}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Droplet className="w-4 h-4 text-red-500" />
                        <span className="text-slate-500">Dự kiến: <strong className="text-red-600">{(getEventExpectedAmount(event.id) / 1000).toFixed(1)}L</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenQrScanner(event); }}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Check-in
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenStats(event); }}
                      className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1.5 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <BarChart2 className="w-3.5 h-3.5" /> Thống kê
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(event); }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); confirmDelete(event.id); }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleExecuteDelete}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể hoàn tác."
        confirmText="Xóa ngay"
        cancelText="Hủy"
        variant="danger"
      />

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {isQrModalOpen && activeEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  Check-in QR Code
                </h3>
                <button onClick={() => setIsQrModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 flex flex-col items-center justify-center space-y-8">
                <div className="text-center">
                  <p className="font-bold text-slate-900 text-lg">{activeEvent.title}</p>
                  <p className="text-sm text-slate-500 mt-1">Đưa mã QR của người hiến máu vào khung hình</p>
                </div>
                
                <div className="relative w-64 h-64 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-4 border-indigo-500/30 shadow-inner">
                  <ScanLine className="w-16 h-16 text-indigo-500 animate-pulse" />
                  {/* Simulated scanner line */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>
                
                <div className="w-full">
                  <p className="text-xs text-center text-slate-400 mb-3 uppercase tracking-wider font-bold">Hoặc nhập mã thủ công</p>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Nhập mã check-in..." className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 hover:bg-white transition-colors" />
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl shadow-sm shadow-indigo-200">Xác nhận</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {isStatsModalOpen && activeEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                  <BarChart2 className="w-5 h-5 text-purple-600" />
                  Thống kê sự kiện
                </h3>
                <button onClick={() => setIsStatsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <h4 className="font-bold text-slate-900 text-xl">{activeEvent.title}</h4>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-2 font-medium">
                    <Calendar className="w-4 h-4" /> {isValid(parseISO(activeEvent.date)) ? format(parseISO(activeEvent.date), 'dd/MM/yyyy') : activeEvent.date}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-700 mb-3">
                      <Users className="w-5 h-5" />
                      <span className="font-bold text-sm">Người tham gia</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900">{activeEvent.registered}</span>
                      <span className="text-sm font-medium text-slate-500 mb-1">/ {activeEvent.target}</span>
                    </div>
                    <div className="w-full bg-blue-200/50 rounded-full h-2 mt-4 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (activeEvent.registered / activeEvent.target) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-blue-600 h-full rounded-full"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-5 rounded-2xl border border-red-100">
                    <div className="flex items-center gap-2 text-red-700 mb-3">
                      <Heart className="w-5 h-5" />
                      <span className="font-bold text-sm">Lượng máu (dự kiến)</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-900">{activeEvent.registered * 350}</span>
                      <span className="text-sm font-medium text-slate-500 mb-1">ml</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-4">Trung bình 350ml/người</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Tỷ lệ Check-in</h5>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Đã đến (ước tính)</span>
                    <span className="text-sm font-bold text-slate-900">{Math.floor(activeEvent.registered * 0.85)} người</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 mb-5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                      className="bg-emerald-500 h-full rounded-full"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Hủy/Vắng mặt</span>
                    <span className="text-sm font-bold text-slate-900">{Math.ceil(activeEvent.registered * 0.15)} người</span>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 rounded-xl border-slate-200 hover:bg-slate-50"
                    onClick={() => {
                      setIsStatsModalOpen(false);
                      navigate(`/admin/participants?event=${encodeURIComponent(activeEvent.title)}`);
                    }}
                  >
                    <List className="w-4 h-4" /> Xem danh sách chi tiết
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
