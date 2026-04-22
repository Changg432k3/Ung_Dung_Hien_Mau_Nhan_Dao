import React, { useState, useMemo } from 'react';
import { useApp, User, BloodGroup } from '../../store/AppContext';
import { 
  Search, Filter, User as UserIcon, Shield, ShieldOff, 
  Award, Droplets, Calendar, Mail, Phone, MapPin, 
  MoreVertical, Edit, Lock, Unlock, CheckCircle, 
  X, Info, History, Heart, AlertCircle, Clock, ExternalLink
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

import { toast } from 'sonner';
import { motion } from 'motion/react';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export const AdminDonors: React.FC = () => {
  const { users, records, updateUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodFilter, setBloodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [userToLock, setUserToLock] = useState<User | null>(null);

  const duplicateUsers = useMemo(() => {
    const emailMap = new Map<string, string[]>();
    const phoneMap = new Map<string, string[]>();
    const duplicates = new Set<string>();

    users.forEach(user => {
      if (['admin', 'staff', 'organizer'].includes(user.role)) return;
      
      if (user.email) {
        const email = user.email.toLowerCase();
        if (!emailMap.has(email)) emailMap.set(email, []);
        emailMap.get(email)!.push(user.id);
      }
      
      if (user.phone) {
        const phone = user.phone.replace(/\D/g, '');
        if (phone) {
          if (!phoneMap.has(phone)) phoneMap.set(phone, []);
          phoneMap.get(phone)!.push(user.id);
        }
      }
    });

    emailMap.forEach(ids => {
      if (ids.length > 1) ids.forEach(id => duplicates.add(id));
    });
    
    phoneMap.forEach(ids => {
      if (ids.length > 1) ids.forEach(id => duplicates.add(id));
    });

    return duplicates;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (!u) return false;
      if (['admin', 'staff', 'organizer'].includes(u.role)) return false;
      const matchesSearch = (u.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                           (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (u.phone && u.phone.includes(searchQuery));
      const matchesBlood = bloodFilter ? u.bloodGroup === bloodFilter : true;
      let matchesStatus = true;
      if (statusFilter === 'locked') matchesStatus = !!u.isLocked;
      else if (statusFilter === 'regular') matchesStatus = !!u.isRegularDonor;
      else if (statusFilter === 'duplicate') matchesStatus = duplicateUsers.has(u.id);
      
      return matchesSearch && matchesBlood && matchesStatus;
    }).sort((a, b) => {
      const dateA = a.lastDonationDate && !isNaN(new Date(a.lastDonationDate).getTime()) ? new Date(a.lastDonationDate).getTime() : 0;
      const dateB = b.lastDonationDate && !isNaN(new Date(b.lastDonationDate).getTime()) ? new Date(b.lastDonationDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [users, searchQuery, bloodFilter, statusFilter, duplicateUsers]);

  const handleOpenModal = (user: User) => {
    setSelectedUser(user);
    setEditForm(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateUser(selectedUser.id, editForm);
      handleCloseModal();
    }
  };

  const toggleLock = (user: User) => {
    setUserToLock(user);
  };

  const confirmToggleLock = () => {
    if (userToLock) {
      updateUser(userToLock.id, { isLocked: !userToLock.isLocked });
      toast.success(userToLock.isLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
      setUserToLock(null);
    }
  };

  const getDonationEligibility = (user: User) => {
    if (user.isLocked) return { eligible: false, reason: 'Tài khoản đang bị khóa' };
    if (!user.lastDonationDate || isNaN(new Date(user.lastDonationDate).getTime())) return { eligible: true, reason: 'Sẵn sàng hiến máu' };
    
    const daysSinceLast = differenceInDays(new Date(), new Date(user.lastDonationDate));
    const waitPeriod = 84; // 12 weeks
    
    if (daysSinceLast < waitPeriod) {
      return { 
        eligible: false, 
        reason: `Cần nghỉ ngơi thêm ${waitPeriod - daysSinceLast} ngày`,
        daysRemaining: waitPeriod - daysSinceLast
      };
    }
    
    return { eligible: true, reason: 'Đủ điều kiện hiến lại' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý người hiến máu</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi hồ sơ, lịch sử hiến máu và tình trạng y tế của người dùng.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên, email, số điện thoại..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
          >
            <option value="">Nhóm máu</option>
            <option value="Chưa xác định">Chưa xác định</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
              <option key={`blood-filter-${bg}`} value={bg}>{bg}</option>
            ))}
          </select>
          <select 
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="regular">Người hiến thường xuyên</option>
            <option value="locked">Tài khoản bị khóa</option>
            <option value="duplicate">Tài khoản trùng lặp</option>
          </select>
        </div>
      </div>

      {/* Donor Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-4">Người hiến</th>
                <th scope="col" className="px-6 py-4">Nhóm máu</th>
                <th scope="col" className="px-6 py-4">Số lần hiến</th>
                <th scope="col" className="px-6 py-4">Phân loại</th>
                <th scope="col" className="px-6 py-4">Trạng thái</th>
                <th scope="col" className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const eligibility = getDonationEligibility(user);
                const isDuplicate = duplicateUsers.has(user.id);
                
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={`border-b border-slate-100 transition-colors ${isDuplicate ? 'bg-amber-50/50 hover:bg-amber-50' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar || undefined} 
                          alt={user.name || 'User'} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{user.name || 'Người dùng không tên'}</span>
                            {isDuplicate && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200" title="Trùng lặp SĐT hoặc Email">
                                Trùng lặp
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">{user.email || 'Không có email'}</span>
                          {user.phone && <span className="text-xs text-slate-500">{user.phone}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                        {user.bloodGroup || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {user.donationsCount}
                    </td>
                    <td className="px-6 py-4">
                      {user.isRegularDonor ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Thường xuyên</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-200">Vãng lai</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.isLocked ? (
                        <span className="flex items-center gap-1.5 text-red-600 font-medium">
                          <Lock className="w-3.5 h-3.5" /> Bị khóa
                        </span>
                      ) : eligibility.eligible ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Sẵn sàng
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-600 font-medium" title={eligibility.reason}>
                          <Clock className="w-3.5 h-3.5" /> Nghỉ ngơi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết & Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleLock(user)}
                          className={`p-1.5 rounded-lg transition-colors ${user.isLocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'}`}
                          title={user.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
                        >
                          {user.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-4">
                <img src={selectedUser.avatar || undefined} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-200" />
                <div>
                  <h3 className="font-bold text-lg sm:text-xl">{selectedUser.name}</h3>
                  <p className="text-slate-500 text-xs sm:text-sm">ID: {selectedUser.id} • {selectedUser.email}</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Left Column: Basic Info */}
                <div className="space-y-6">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" /> Thông tin cơ bản
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Số điện thoại</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Địa chỉ</label>
                      <textarea 
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                        value={editForm.address || ''}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Ngày sinh</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                          value={editForm.birthDate || ''}
                          onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Giới tính</label>
                        <select 
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                          value={editForm.gender || ''}
                          onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as any })}
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                      <Shield className="w-4 h-4 text-emerald-500" /> Trạng thái tài khoản
                    </h4>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">Khóa tài khoản</span>
                        <span className="text-xs text-slate-500">Người dùng sẽ không thể đăng nhập</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setEditForm({ ...editForm, isLocked: !editForm.isLocked })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${editForm.isLocked ? 'bg-red-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.isLocked ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Middle Column: Medical & Classification */}
                <div className="space-y-6">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" /> Thông tin y tế
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Nhóm máu</label>
                      <select 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                        value={editForm.bloodGroup || 'Chưa xác định'}
                        onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value as BloodGroup })}
                      >
                        <option value="Chưa xác định">Chưa xác định</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={`blood-edit-${bg}`} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Ghi chú y tế / Tiền sử bệnh</label>
                      <textarea 
                        rows={5}
                        placeholder="Nhập các thông tin y tế quan trọng, dị ứng, thuốc đang dùng..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500"
                        value={editForm.medicalInfo || ''}
                        onChange={(e) => setEditForm({ ...editForm, medicalInfo: e.target.value })}
                      />
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex gap-3">
                        <Heart className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-blue-900">Đánh giá mức độ phù hợp</p>
                          <p className="text-xs text-blue-700 mt-1">
                            {getDonationEligibility(selectedUser).reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                      <Award className="w-4 h-4 text-amber-500" /> Phân loại & Nhắc lịch
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-sm font-medium text-slate-900">Người hiến thường xuyên</span>
                        <button 
                          type="button"
                          onClick={() => setEditForm({ ...editForm, isRegularDonor: !editForm.isRegularDonor })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${editForm.isRegularDonor ? 'bg-emerald-600' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editForm.isRegularDonor ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <Button 
                        type="button"
                        variant="outline" 
                        className="w-full text-xs flex items-center gap-2 justify-center"
                        onClick={() => {
                          const newDate = new Date().toISOString();
                          updateUser(selectedUser.id, { lastReminderDate: newDate });
                          setSelectedUser({ ...selectedUser, lastReminderDate: newDate });
                          toast.success('Đã gửi thông báo nhắc lịch hiến máu lại cho người dùng!');
                        }}
                      >
                        <Calendar className="w-3.5 h-3.5" /> Gửi nhắc lịch hiến lại
                      </Button>
                      {selectedUser.lastReminderDate && !isNaN(new Date(selectedUser.lastReminderDate).getTime()) && (
                        <p className="text-[10px] text-slate-500 text-center mt-1">
                          Đã nhắc lần cuối: {format(new Date(selectedUser.lastReminderDate), 'dd/MM/yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: History */}
                <div className="space-y-6">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-500" /> Lịch sử hiến máu
                  </h4>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {records.filter(r => r.userId === selectedUser.id).length > 0 ? (
                      records
                        .filter(r => r.userId === selectedUser.id)
                        .sort((a, b) => {
                          const dateA = new Date(a.date).getTime();
                          const dateB = new Date(b.date).getTime();
                          if (isNaN(dateA) && isNaN(dateB)) return 0;
                          if (isNaN(dateA)) return 1;
                          if (isNaN(dateB)) return -1;
                          return dateB - dateA;
                        })
                        .map(record => (
                          <div key={record.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-slate-400">
                                {isValid(parseISO(record.date)) ? format(parseISO(record.date), 'dd/MM/yyyy') : record.date}
                              </span>
                              <Badge variant="outline" className={
                                record.status === 'completed' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                record.status === 'registered' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                                'text-slate-400 bg-slate-50 border-slate-100'
                              }>
                                {record.status === 'completed' ? 'Thành công' : record.status === 'registered' ? 'Đã đăng ký' : 'Đã hủy'}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-slate-900 truncate">Sự kiện ID: {record.eventId}</p>
                            {record.amount > 0 && <p className="text-xs text-red-600 font-bold mt-1">{record.amount}ml • Nhóm {record.bloodGroup}</p>}
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Droplets className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">Chưa có lịch sử hiến máu</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                    <p className="text-xs text-red-600 uppercase font-bold tracking-wider mb-1">Tổng số lần hiến</p>
                    <p className="text-3xl font-black text-red-700">{selectedUser.donationsCount}</p>
                    <div className="flex justify-center gap-1 mt-2">
                      {Array.from({ length: Math.min(5, selectedUser.donationsCount) }).map((_, i) => (
                        <Droplets key={i} className="w-4 h-4 text-red-500 fill-red-500" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-slate-200 shrink-0 bg-slate-50">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Đóng</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Lock/Unlock Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!userToLock}
        onClose={() => setUserToLock(null)}
        onConfirm={confirmToggleLock}
        title={userToLock?.isLocked ? "Xác nhận mở khóa" : "Xác nhận khóa tài khoản"}
        description={userToLock?.isLocked 
          ? `Bạn có chắc chắn muốn mở khóa tài khoản của ${userToLock?.name}? Người dùng sẽ có thể đăng nhập và sử dụng hệ thống bình thường.`
          : `Bạn có chắc chắn muốn khóa tài khoản của ${userToLock?.name}? Người dùng sẽ không thể đăng nhập vào hệ thống.`}
        confirmText={userToLock?.isLocked ? "Mở khóa" : "Khóa tài khoản"}
        cancelText="Hủy"
        variant={userToLock?.isLocked ? "info" : "danger"}
      />
    </div>
  );
};