import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp, Event, BloodGroup } from '../../store/AppContext';
import { VIETNAM_PROVINCES } from '../../constants/provinces';
import { ArrowLeft, MapPin, Calendar, Clock, Info, Save, Image as ImageIcon, Plus, Trash2, List, BarChart2, Droplet, Users, ExternalLink, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { format, isPast, isToday, parseISO, isValid } from 'date-fns';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const AdminEventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, updateEvent, locations, records, users, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState('info');
  
  const [formData, setFormData] = useState<Partial<Event> | null>(null);

  useEffect(() => {
    const event = events.find(e => e.id === id);
    if (event) {
      setFormData(event);
    } else {
      navigate('/admin/events');
    }
  }, [id, events, navigate]);

  const eventStats = useMemo(() => {
    if (!id) return null;
    const eventRecords = records.filter(r => r.eventId === id && r.status !== 'cancelled');
    
    const bloodGroupStats: Record<string, { count: number, expectedAmount: number }> = {};
    
    eventRecords.forEach(record => {
      const user = users.find(u => u.id === record.userId);
      const bg = user?.bloodGroup || 'Chưa rõ';
      if (!bloodGroupStats[bg]) {
        bloodGroupStats[bg] = { count: 0, expectedAmount: 0 };
      }
      bloodGroupStats[bg].count += 1;
      bloodGroupStats[bg].expectedAmount += (record.expectedAmount || 250);
    });
    
    return {
      totalRegistered: eventRecords.length,
      totalExpectedAmount: eventRecords.reduce((sum, r) => sum + (r.expectedAmount || 250), 0),
      bloodGroupStats: Object.entries(bloodGroupStats).map(([group, stats]) => ({
        group,
        ...stats
      })).sort((a, b) => b.expectedAmount - a.expectedAmount)
    };
  }, [id, records, users]);

  if (!formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id && formData) {
      updateEvent(id, formData);
      
      // Notify registered users about the update
      const registeredUsers = records
        .filter(r => r.eventId === id && r.status === 'registered')
        .map(r => r.userId);
      
      registeredUsers.forEach(userId => {
        addNotification({
          userId,
          title: 'Cập nhật sự kiện',
          message: `Sự kiện "${formData.title}" đã được cập nhật thông tin mới. Vui lòng kiểm tra lại!`,
          type: 'event_update',
          link: `/events/${id}`
        });
      });

      toast.success('Cập nhật thông tin sự kiện thành công!');
    }
  };

  const selectedLocation = locations.find(l => l.name === formData.location || l.id === formData.locationId);
  const mapCenter: [number, number] = selectedLocation 
    ? [selectedLocation.lat, selectedLocation.lng] 
    : [10.762622, 106.660172]; // Default to HCMC

  const handleAddScheduleItem = () => {
    const newSchedule = [...(formData.schedule || []), { id: Date.now().toString(), time: '', activity: '' }];
    setFormData({ ...formData, schedule: newSchedule });
  };

  const handleUpdateScheduleItem = (id: string, field: 'time' | 'activity', value: string) => {
    const newSchedule = (formData.schedule || []).map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, schedule: newSchedule });
  };

  const handleDeleteScheduleItem = (id: string) => {
    const newSchedule = (formData.schedule || []).filter(item => item.id !== id);
    setFormData({ ...formData, schedule: newSchedule });
  };

  const getEventStatus = () => {
    if (!formData.startDate) return null;
    const eventDate = parseISO(formData.startDate);
    if (!isValid(eventDate)) return null;
    if (isToday(eventDate)) {
      return { label: 'Đang diễn ra', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Activity };
    } else if (isPast(eventDate)) {
      return { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: CheckCircle };
    } else {
      return { label: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar };
    }
  };

  const status = getEventStatus();
  const StatusIcon = status?.icon || Info;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate('/admin/events')}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm group mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{formData.title}</h1>
              {status && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${status.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {formData.startDate && formData.endDate && formData.startDate !== formData.endDate
                  ? `${isValid(parseISO(formData.startDate)) ? format(parseISO(formData.startDate), 'dd/MM/yyyy') : formData.startDate} - ${isValid(parseISO(formData.endDate)) ? format(parseISO(formData.endDate), 'dd/MM/yyyy') : formData.endDate}`
                  : (formData.startDate ? (isValid(parseISO(formData.startDate)) ? format(parseISO(formData.startDate), 'dd/MM/yyyy') : formData.startDate) : 'Chưa xác định')
                }
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {formData.time || 'Chưa xác định'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {formData.location || 'Chưa xác định'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-start">
          <Button 
            onClick={(e) => handleSubmit(e as any)} 
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm shadow-red-200"
          >
            <Save className="w-4 h-4 mr-2" />
            Lưu thay đổi
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Modern Tabs */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 pt-6">
          <div className="flex space-x-2 overflow-x-auto pb-4 hide-scrollbar">
            {[
              { id: 'info', label: 'Thông tin chung', icon: Info },
              { id: 'schedule', label: 'Lịch trình', icon: List },
              { id: 'stats', label: 'Thống kê', icon: BarChart2 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-2xl transition-all whitespace-nowrap ${
                    isActive 
                      ? 'text-red-700 bg-red-50' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-red-600 rounded-t-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.form 
                key="info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit} 
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* General Info Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Info className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Thông tin cơ bản</h3>
                      </div>
                      <div className="p-6 space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Tên sự kiện <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            required
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Nhập tên sự kiện..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-3">Loại sự kiện <span className="text-red-500">*</span></label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                              formData.category === 'routine' ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500' : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}>
                              <input 
                                type="radio" 
                                name="category"
                                value="routine"
                                checked={formData.category === 'routine'}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'routine' | 'urgent' | 'special' })}
                                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300"
                              />
                              <div>
                                <span className="block text-sm font-bold text-slate-900">Hiến máu thường</span>
                                <span className="block text-xs text-slate-500 mt-0.5">Sự kiện định kỳ, theo kế hoạch</span>
                              </div>
                            </label>
                            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                              formData.category === 'urgent' ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500' : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}>
                              <input 
                                type="radio" 
                                name="category"
                                value="urgent"
                                checked={formData.category === 'urgent'}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'routine' | 'urgent' | 'special' })}
                                className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300"
                              />
                              <div>
                                <span className="block text-sm font-bold text-slate-900">Hiến máu khẩn cấp</span>
                                <span className="block text-xs text-slate-500 mt-0.5">Cần máu gấp cho bệnh nhân</span>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ngày bắt đầu <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input 
                                type="date" 
                                required
                                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                                value={formData.startDate || ''}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ngày kết thúc <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input 
                                type="date" 
                                required
                                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                                value={formData.endDate || ''}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Thời gian <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input 
                                type="text" 
                                required
                                placeholder="08:00 - 11:30"
                                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                                value={formData.time || ''}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Mục tiêu (đơn vị máu) <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input 
                                type="number" 
                                required
                                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                                value={formData.target || ''}
                                onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Nhóm máu cần thiết (Tùy chọn)</label>
                            <div className="flex flex-wrap gap-2">
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => {
                                const isSelected = formData.neededBloodTypes?.includes(bg as BloodGroup);
                                return (
                                  <label key={`${bg}-event-details`} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-colors ${isSelected ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected || false}
                                      onChange={() => {
                                        const current = formData.neededBloodTypes || [];
                                        if (current.includes(bg as BloodGroup)) {
                                          setFormData({ ...formData, neededBloodTypes: current.filter(t => t !== bg) });
                                        } else {
                                          setFormData({ ...formData, neededBloodTypes: [...current, bg as BloodGroup] });
                                        }
                                      }}
                                      className="text-red-600 focus:ring-red-500 rounded"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{bg}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả chi tiết</label>
                          <textarea 
                            rows={6}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors resize-none"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Nhập mô tả chi tiết về sự kiện hiến máu, yêu cầu đối với người tham gia..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Location Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Địa điểm</h3>
                      </div>
                      <div className="p-6 space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Khu vực (Tỉnh/Thành phố)</label>
                          <select 
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50 hover:bg-white transition-colors"
                            value={formData.region || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              region: e.target.value,
                              location: '',
                              locationId: '',
                              address: '',
                              lat: 0,
                              lng: 0
                            })}
                          >
                            <option value="">-- Chọn khu vực --</option>
                            {VIETNAM_PROVINCES.map(province => (
                              <option key={province} value={province}>{province}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Điểm hiến máu <span className="text-red-500">*</span></label>
                          <select 
                            required
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50 hover:bg-white transition-colors"
                            value={locations.find(l => l.name === formData.location)?.id || ''}
                            onChange={(e) => {
                              const selectedLoc = locations.find(l => l.id === e.target.value);
                              if (selectedLoc) {
                                // Find region from address
                                const foundRegion = VIETNAM_PROVINCES.find(province => {
                                  if (selectedLoc.address.includes(province)) return true;
                                  if (province === "TP. Hồ Chí Minh" && (selectedLoc.address.includes("TP.HCM") || selectedLoc.address.includes("TP HCM"))) return true;
                                  if (province === "Hà Nội" && selectedLoc.address.includes("HN")) return true;
                                  return false;
                                });

                                setFormData({ 
                                  ...formData, 
                                  location: selectedLoc.name,
                                  locationId: selectedLoc.id,
                                  address: selectedLoc.address,
                                  region: foundRegion || formData.region,
                                  lat: selectedLoc.lat,
                                  lng: selectedLoc.lng
                                });
                              } else {
                                setFormData({ ...formData, location: '', locationId: '', address: '', lat: 0, lng: 0 });
                              }
                            }}
                          >
                            <option value="">-- Chọn điểm hiến máu --</option>
                            {locations.filter(l => !formData.region || l.address.includes(formData.region)).map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Địa chỉ chi tiết</label>
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600 min-h-[46px] flex items-center">
                            {formData.address || <span className="text-slate-400 italic">Chưa có địa chỉ</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Image Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Hình ảnh</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Hình ảnh sự kiện</label>
                          <div className="flex gap-2 mb-2">
                            <input 
                              type="text" 
                              placeholder="Nhập URL hình ảnh hoặc tải lên..."
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                              value={formData.imageUrl || ''}
                              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            />
                            <label className="flex-shrink-0 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl transition-colors flex items-center justify-center">
                              <span className="text-sm font-medium">Tải ảnh lên</span>
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setFormData(prev => prev ? { ...prev, imageUrl: reader.result as string } : prev);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        
                        <div className="rounded-xl overflow-hidden border border-slate-200 h-40 bg-slate-50 relative group">
                          {formData.imageUrl ? (
                            <img 
                              src={formData.imageUrl || undefined} 
                              alt="Preview" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=400&h=200';
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                              <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                              <span className="text-sm font-medium">Chưa có hình ảnh</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.form>
            )}

            {activeTab === 'schedule' && (
              <motion.div 
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                  <div>
                    <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-2">
                      <List className="w-5 h-5 text-indigo-600" />
                      Lịch trình chi tiết
                    </h3>
                    <p className="text-indigo-700/70 text-sm mt-1">Quản lý các hoạt động diễn ra trong sự kiện</p>
                  </div>
                  <Button 
                    onClick={handleAddScheduleItem}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-200 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm hoạt động
                  </Button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {(!formData.schedule || formData.schedule.length === 0) ? (
                    <div className="p-12 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <List className="w-8 h-8 text-slate-300" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-700 mb-2">Chưa có lịch trình</h4>
                      <p className="text-slate-500 max-w-md mx-auto mb-6">
                        Thêm các mốc thời gian và hoạt động để người tham gia có thể theo dõi tiến trình của sự kiện.
                      </p>
                      <Button 
                        onClick={handleAddScheduleItem}
                        variant="outline"
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm hoạt động đầu tiên
                      </Button>
                    </div>
                  ) : (
                    <div className="p-6 relative">
                      {/* Timeline line */}
                      <div className="absolute left-[39px] md:left-[119px] top-10 bottom-10 w-0.5 bg-indigo-100"></div>
                      
                      <div className="space-y-6">
                        {formData.schedule.sort((a, b) => a.time.localeCompare(b.time)).map((item, index) => (
                          <div key={item.id} className="relative flex items-start gap-4 md:gap-8 group">
                            {/* Time input */}
                            <div className="w-20 md:w-24 shrink-0 pt-1">
                              <input 
                                type="time" 
                                className="w-full px-2 py-1.5 text-sm font-bold text-indigo-900 bg-indigo-50 border border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                                value={item.time}
                                onChange={(e) => handleUpdateScheduleItem(item.id, 'time', e.target.value)}
                              />
                            </div>
                            
                            {/* Timeline node */}
                            <div className="relative z-10 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 mt-2.5 shrink-0 group-hover:scale-125 group-hover:bg-indigo-500 transition-all"></div>
                            
                            {/* Activity input */}
                            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-1 flex items-center gap-2 group-hover:border-indigo-200 group-hover:bg-white transition-colors shadow-sm">
                              <input 
                                type="text" 
                                className="flex-1 px-4 py-2.5 bg-transparent border-none focus:ring-0 text-slate-700 font-medium placeholder:text-slate-400"
                                value={item.activity}
                                onChange={(e) => handleUpdateScheduleItem(item.id, 'activity', e.target.value)}
                                placeholder="Nhập tên hoạt động (VD: Bắt đầu tiếp nhận đăng ký)"
                              />
                              <button 
                                onClick={() => handleDeleteScheduleItem(item.id)}
                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-1 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                title="Xóa hoạt động"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && eventStats && (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-3xl border border-blue-400 shadow-lg shadow-blue-500/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 text-blue-100 mb-6">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-lg">Tổng người đăng ký</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black">{eventStats.totalRegistered}</span>
                        <span className="text-blue-100 font-medium text-lg">người</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-500 to-red-600 p-8 rounded-3xl border border-red-400 shadow-lg shadow-red-500/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 text-red-100 mb-6">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Droplet className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-bold text-lg">Tổng lượng máu dự kiến</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black">{(eventStats.totalExpectedAmount / 1000).toFixed(1)}</span>
                        <span className="text-red-100 font-medium text-lg">Lít</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50/80 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-indigo-500" />
                      Phân bổ theo nhóm máu
                    </h3>
                    <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                      Dữ liệu dự kiến
                    </span>
                  </div>
                  
                  <div className="p-8">
                    {eventStats.bloodGroupStats.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-700 mb-1">Chưa có dữ liệu</h4>
                        <p className="text-slate-500">Chưa có người đăng ký tham gia sự kiện này.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {eventStats.bloodGroupStats.map((stat, index) => {
                          const percentage = Math.round((stat.expectedAmount / eventStats.totalExpectedAmount) * 100);
                          // Generate a color based on index for visual variety
                          const colors = [
                            'bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 
                            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'
                          ];
                          const colorClass = colors[index % colors.length];
                          const lightColorClass = colorClass.replace('500', '50');
                          const textColorClass = colorClass.replace('bg-', 'text-');
                          
                          return (
                            <div key={stat.group} className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl ${lightColorClass} ${textColorClass} flex items-center justify-center font-black text-xl shrink-0 border border-slate-100`}>
                                {stat.group}
                              </div>
                              
                              <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-end">
                                  <div>
                                    <span className="font-bold text-slate-800 text-lg">{stat.expectedAmount.toLocaleString()} ml</span>
                                    <span className="text-slate-500 text-sm ml-2">({stat.count} người)</span>
                                  </div>
                                  <span className={`font-bold ${textColorClass}`}>{percentage}%</span>
                                </div>
                                
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className={`h-full rounded-full ${colorClass}`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

