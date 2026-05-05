import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, BloodGroup } from '../store/AppContext';
import { VIETNAM_PROVINCES } from '../constants/provinces';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export const CreateEvent: React.FC = () => {
  const { addEvent, locations } = useApp();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    time: '',
    location: '',
    address: '',
    lat: 10.7769,
    lng: 106.7009,
    target: '',
    description: '',
    imageUrl: '',
    category: 'routine' as 'routine' | 'urgent' | 'special',
    schedule: [] as { id: string; time: string; activity: string }[],
    region: '',
    neededBloodTypes: [] as BloodGroup[]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'location') {
      const selectedLoc = locations.find(l => l.id === value);
      if (selectedLoc) {
        // Find region from address
        const foundRegion = VIETNAM_PROVINCES.find(province => {
          if (selectedLoc.address.includes(province)) return true;
          if (province === "TP. Hồ Chí Minh" && (selectedLoc.address.includes("TP.HCM") || selectedLoc.address.includes("TP HCM"))) return true;
          if (province === "Hà Nội" && selectedLoc.address.includes("HN")) return true;
          return false;
        });

        setFormData(prev => ({
          ...prev,
          location: selectedLoc.name,
          locationId: selectedLoc.id,
          address: selectedLoc.address,
          region: foundRegion || '',
          lat: selectedLoc.lat,
          lng: selectedLoc.lng
        }));
      } else {
        setFormData(prev => ({ ...prev, location: '', locationId: '', address: '', region: '', lat: 10.7769, lng: 106.7009 }));
      }
    } else if (name === 'region') {
      setFormData(prev => ({
        ...prev,
        region: value,
        location: '',
        locationId: '',
        address: '',
        lat: 10.7769,
        lng: 106.7009
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddScheduleItem = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { id: Date.now().toString(), time: '', activity: '' }]
    }));
  };

  const handleUpdateScheduleItem = (id: string, field: 'time' | 'activity', value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleDeleteScheduleItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter(item => item.id !== id)
    }));
  };

  const handleBloodGroupChange = (bg: BloodGroup) => {
    setFormData(prev => {
      const current = prev.neededBloodTypes;
      if (current.includes(bg)) {
        return { ...prev, neededBloodTypes: current.filter(t => t !== bg) };
      } else {
        return { ...prev, neededBloodTypes: [...current, bg] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate || !formData.target) {
      toast.error('Vui lòng điền các trường bắt buộc');
      return;
    }

    addEvent({
      title: formData.title,
      date: formData.startDate,
      startDate: formData.startDate,
      endDate: formData.endDate,
      time: formData.time || '07:00 - 11:30',
      location: formData.location || 'Bệnh viện',
      address: formData.address || 'TP.HCM',
      lat: formData.lat,
      lng: formData.lng,
      organizer: 'Hội Chữ thập đỏ',
      target: parseInt(formData.target),
      description: formData.description,
      imageUrl: formData.imageUrl,
      category: formData.category,
      schedule: formData.schedule,
      region: formData.region,
      neededBloodTypes: formData.neededBloodTypes.length > 0 ? formData.neededBloodTypes : undefined
    });

    toast.success('Tạo sự kiện thành công!');
    navigate('/admin/events');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Tạo sự kiện mới</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên sự kiện *</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="VD: Ngày hội hiến máu mùa hè"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Loại sự kiện *</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="category"
                    value="routine"
                    checked={formData.category === 'routine'}
                    onChange={handleChange}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-slate-700">Hiến máu thường</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="category"
                    value="urgent"
                    checked={formData.category === 'urgent'}
                    onChange={handleChange}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-slate-700">Hiến máu khẩn cấp</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu *</label>
                <input 
                  type="date" 
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc *</label>
                <input 
                  type="date" 
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian</label>
              <input 
                type="text" 
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="07:00 - 11:30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Khu vực (Tỉnh/Thành phố)</label>
              <select 
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
              >
                <option value="">-- Chọn khu vực --</option>
                {VIETNAM_PROVINCES.map(province => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Điểm hiến máu *</label>
              <select 
                name="location"
                value={locations.find(l => l.name === formData.location)?.id || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
                required
              >
                <option value="">-- Chọn điểm hiến máu --</option>
                {locations.filter(l => (l.status ?? 'active') === 'active' && (!formData.region || l.address.includes(formData.region))).map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ chi tiết</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50"
                placeholder="Địa chỉ sẽ tự động điền khi chọn điểm hiến máu..."
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mục tiêu (đơn vị máu) *</label>
              <input 
                type="number" 
                name="target"
                value={formData.target}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nhóm máu cần thiết (Tùy chọn)</label>
              <div className="flex flex-wrap gap-3">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <label key={bg} className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={formData.neededBloodTypes.includes(bg as BloodGroup)}
                      onChange={() => handleBloodGroupChange(bg as BloodGroup)}
                      className="text-red-600 focus:ring-red-500 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">{bg}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                rows={3}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh sự kiện</label>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="Nhập URL hình ảnh hoặc tải lên..."
                />
                <label className="flex-shrink-0 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-4 py-2 rounded-md transition-colors flex items-center justify-center">
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
                          setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              {formData.imageUrl && (
                <div className="mt-2 rounded-md overflow-hidden border border-slate-200 h-32 bg-slate-50">
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&q=80&w=400&h=200';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-slate-700">Lịch trình sự kiện</label>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleAddScheduleItem}
                  className="text-sm py-1 h-auto flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Thêm hoạt động
                </Button>
              </div>
              
              {formData.schedule.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200 border-dashed text-slate-500 text-sm">
                  Chưa có lịch trình nào. Nhấn "Thêm hoạt động" để bắt đầu.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.schedule.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-32">
                        <input 
                          type="time" 
                          value={item.time}
                          onChange={(e) => handleUpdateScheduleItem(item.id, 'time', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          placeholder="07:00"
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={item.activity}
                          onChange={(e) => handleUpdateScheduleItem(item.id, 'activity', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          placeholder="VD: Bắt đầu tiếp nhận đăng ký"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleDeleteScheduleItem(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/events')}>Hủy</Button>
              <Button type="submit">Tạo sự kiện</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
