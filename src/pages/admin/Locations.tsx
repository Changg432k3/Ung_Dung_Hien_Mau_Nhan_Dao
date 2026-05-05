import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { MapPin, Plus, Edit, Trash2, Search, X, Filter, Navigation, CheckCircle2 } from 'lucide-react';
import { VIETNAM_PROVINCES } from '../../constants/provinces';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';

const LocationImage: React.FC<{ imageUrl?: string; alt: string; type?: string }> = ({ imageUrl, alt, type = 'hospital' }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate a gradient background based on location type
  const getGradient = () => {
    switch (type) {
      case 'hospital':
        return 'bg-gradient-to-br from-red-100 to-rose-200';
      case 'center':
        return 'bg-gradient-to-br from-emerald-100 to-teal-200';
      case 'mobile':
        return 'bg-gradient-to-br from-amber-100 to-orange-200';
      default:
        return 'bg-gradient-to-br from-slate-100 to-slate-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'hospital':
        return '🏥';
      case 'center':
        return '🩸';
      case 'mobile':
        return '🚐';
      default:
        return '📍';
    }
  };

  if (!imageUrl || hasError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center ${getGradient()}`}>
        <span className="text-5xl mb-2">{getIcon()}</span>
        <p className="text-xs text-slate-500 font-medium">{alt}</p>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover"
      loading="lazy"
      onLoad={() => setIsLoading(false)}
      onError={() => setHasError(true)}
    />
  );
};

// Add Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

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

export interface Location {
  id: string;
  name: string;
  address: string;
  region: string;
  lat: number;
  lng: number;
  contactInfo?: string;
  type: 'hospital' | 'center' | 'mobile';
  imageUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

import { ConfirmationModal } from '../../components/ConfirmationModal';

export const AdminLocations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [locationStatusFilter, setLocationStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (isModalOpen && addressInputRef.current && window.google) {
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: 'vn' },
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address && place.geometry) {
          setFormData(prev => ({
            ...prev,
            address: place.formatted_address!,
            lat: place.geometry!.location!.lat(),
            lng: place.geometry!.location!.lng(),
          }));
        }
      });
    }
  }, [isModalOpen]);

  const fetchCoordinates = async (address: string) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=vn`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData(prev => ({ ...prev, lat: parseFloat(lat), lng: parseFloat(lon) }));
        toast.success("Đã tìm thấy tọa độ!");
      } else {
        toast.error("Không tìm thấy tọa độ cho địa chỉ này.");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      toast.error("Có lỗi xảy ra khi tìm tọa độ.");
    }
  };

  const [formData, setFormData] = useState<Partial<Location>>({
    name: '',
    address: '',
    region: '',
    lat: 10.762622,
    lng: 106.660172,
    contactInfo: '',
    type: 'hospital',
    imageUrl: '',
    status: 'active'
  });

  useEffect(() => {
    const q = query(collection(db, 'locations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locs: Location[] = [];
      snapshot.forEach((doc) => {
        locs.push({ id: doc.id, ...doc.data() } as Location);
      });
      setLocations(locs);
      setIsLoading(false);
    }, (error) => {
      toast.error("Không thể tải danh sách điểm hiến máu.");
      setIsLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'locations');
    });

    return () => unsubscribe();
  }, []);

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          loc.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || loc.type === filterType;
    const matchesStatus = locationStatusFilter === 'all' || loc.status === locationStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({ ...location });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        region: '',
        lat: 10.762622,
        lng: 106.660172,
        contactInfo: '',
        type: 'hospital',
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newName = formData.name?.trim().toLowerCase() || '';
      const newAddress = formData.address?.trim().toLowerCase() || '';

      const isDuplicate = locations.some(loc => {
        if (loc.id === editingLocation?.id) return false;
        const existingName = loc.name.trim().toLowerCase();
        const existingAddress = loc.address.trim().toLowerCase();
        return existingName === newName || existingAddress === newAddress;
      });

      if (isDuplicate) {
        toast.error("Điểm hiến máu với tên hoặc địa chỉ này đã tồn tại!");
        return;
      }

      const foundRegion = VIETNAM_PROVINCES.find(province => {
        if (newAddress.includes(province.toLowerCase())) return true;
        if (province === "TP Hồ Chí Minh" && (newAddress.includes("tp.hcm") || newAddress.includes("tp hcm"))) return true;
        if (province === "TP Hà Nội" && newAddress.includes("hn")) return true;
        return false;
      });

      if (editingLocation) {
        const docRef = doc(db, 'locations', editingLocation.id);
        const updatedData = {
          ...formData,
          region: foundRegion || formData.region || '',
          status: formData.status || 'active'
        };
        await updateDoc(docRef, updatedData);
        
        // Update local state immediately for UI consistency
        setLocations(prev => prev.map(loc => loc.id === editingLocation.id ? { ...loc, ...updatedData } as Location : loc));
        
        toast.success("Cập nhật điểm hiến máu thành công!");
      } else {
        await addDoc(collection(db, 'locations'), {
          ...formData,
          region: foundRegion || formData.region || '',
          status: formData.status || 'active',
          createdAt: new Date().toISOString()
        });
        toast.success("Thêm điểm hiến máu thành công!");
      }
      handleCloseModal();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu thông tin.");
      handleFirestoreError(error, editingLocation ? OperationType.UPDATE : OperationType.CREATE, 'locations');
    }
  };

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleToggleStatus = async (location: Location) => {
    try {
      const newStatus = location.status === 'active' ? 'inactive' : 'active';
      const docRef = doc(db, 'locations', location.id);
      await updateDoc(docRef, { status: newStatus });
      setLocations(prev => prev.map(loc => loc.id === location.id ? { ...loc, status: newStatus } : loc));
      toast.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'ẩn'} điểm hiến máu ${location.name}`);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái.');
      handleFirestoreError(error, OperationType.UPDATE, 'locations');
    }
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        await deleteDoc(doc(db, 'locations', deletingId));
        toast.success("Xóa điểm hiến máu thành công!");
      } catch (error) {
        toast.error("Có lỗi xảy ra khi xóa.");
        handleFirestoreError(error, OperationType.DELETE, 'locations');
      }
      setIsConfirmDeleteOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Điểm hiến máu</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý danh sách các địa điểm tổ chức hiến máu.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm địa điểm
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm địa điểm..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Filter className="w-5 h-5 text-slate-400 hidden sm:block" />
          <select 
            className="flex-1 py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tất cả loại hình</option>
            <option value="hospital">Bệnh viện</option>
            <option value="center">Trung tâm</option>
            <option value="mobile">Lưu động</option>
          </select>
          <select
            className="flex-1 py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            value={locationStatusFilter}
            onChange={(e) => setLocationStatusFilter(e.target.value as any)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã ẩn / Không hoạt động</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-500">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="h-40 relative bg-slate-100 overflow-hidden">
                <LocationImage imageUrl={loc.imageUrl} alt={loc.name} type={loc.type} />
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-slate-700 shadow-sm capitalize">
                    {loc.type === 'hospital' ? 'Bệnh viện' : loc.type === 'center' ? 'Trung tâm' : 'Lưu động'}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 text-lg line-clamp-2 mb-2">{loc.name}</h3>
                <div className="space-y-2 mt-auto text-sm text-slate-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{loc.address}</span>
                  </p>
                  {loc.contactInfo && (
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Liên hệ:</span> {loc.contactInfo}
                    </p>
                  )}
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 mt-2 text-xs"
                  >
                    <Navigation className="w-3 h-3" />
                    Chỉ đường
                  </a>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${loc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {loc.status === 'active' ? 'Hoạt động' : 'Ẩn / Không hoạt động'}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleStatus(loc)}
                    className={`p-1.5 ${loc.status === 'active' ? 'text-slate-400 hover:text-orange-600' : 'text-slate-400 hover:text-emerald-600'} transition-colors`}
                    title={loc.status === 'active' ? 'Ẩn địa điểm' : 'Hiển thị địa điểm'}
                  >
                    <span className="sr-only">{loc.status === 'active' ? 'Ẩn' : 'Hiện'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleOpenModal(loc)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(loc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredLocations.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500">
              Không tìm thấy địa điểm nào.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 shrink-0">
              <h3 className="font-bold text-lg sm:text-xl">{editingLocation ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm mới'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên địa điểm *</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Khu vực (Tỉnh/Thành phố) *</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                    value={formData.region || ''}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  >
                    <option value="">-- Chọn khu vực --</option>
                    {VIETNAM_PROVINCES.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ chi tiết *</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      required
                      ref={addressInputRef}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Nhập địa chỉ..."
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        if (formData.address) {
                          fetchCoordinates(formData.address);
                        } else {
                          toast.error("Vui lòng nhập địa chỉ trước.");
                        }
                      }}
                    >
                      Lấy tọa độ
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Tọa độ: {formData.lat?.toFixed(6)}, {formData.lng?.toFixed(6)}</span>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${formData.lat},${formData.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Xem trên Google Maps
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loại địa điểm *</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                    value={formData.type || 'hospital'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="hospital">Bệnh viện</option>
                    <option value="center">Trung tâm hiến máu</option>
                    <option value="mobile">Điểm lưu động</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thông tin liên hệ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                    value={formData.contactInfo || ''}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL Hình ảnh</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Ẩn / Không hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Hủy</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                  {editingLocation ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa điểm hiến máu này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
};
