import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { Award, Edit2, Trash2, Plus, X, Users, Gift, Package, BarChart3, History, Search, Filter, ChevronRight, AlertCircle, CheckCircle2, Star, Heart, Shield, Zap, Droplet, Activity, TrendingUp, Medal, Crown } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Award, Star, Heart, Shield, Zap, Droplet, Activity, TrendingUp, Medal, Crown
};

const LEVEL_DATA: Record<string, { name: string, colorClass: string, bgClass: string, borderClass: string, tagClass: string, barClass: string }> = {
  Silver: { name: 'Bạc', colorClass: 'text-slate-700', bgClass: 'bg-slate-50', borderClass: 'border-slate-200', tagClass: 'bg-slate-200 text-slate-800', barClass: 'bg-slate-400' },
  Bronze: { name: 'Đồng', colorClass: 'text-amber-700', bgClass: 'bg-amber-50', borderClass: 'border-amber-200', tagClass: 'bg-amber-100 text-amber-800', barClass: 'bg-amber-700' },
  Gold: { name: 'Vàng', colorClass: 'text-yellow-600', bgClass: 'bg-yellow-50', borderClass: 'border-yellow-200', tagClass: 'bg-yellow-100 text-yellow-800', barClass: 'bg-yellow-500' },
  Platinum: { name: 'Bạch kim', colorClass: 'text-cyan-700', bgClass: 'bg-cyan-50', borderClass: 'border-cyan-200', tagClass: 'bg-cyan-100 text-cyan-800', barClass: 'bg-cyan-500' },
  Diamond: { name: 'Kim cương', colorClass: 'text-violet-700', bgClass: 'bg-violet-50', borderClass: 'border-violet-200', tagClass: 'bg-violet-100 text-violet-800', barClass: 'bg-violet-500' },
};
import { Badge, Reward } from '../../store/AppContext';
import { motion } from 'motion/react';

type TabType = 'badges' | 'inventory' | 'recipients' | 'stats';

import { ConfirmationModal } from '../../components/ConfirmationModal';

export const AdminBadges: React.FC = () => {
  const { badges, addBadge, updateBadge, deleteBadge, users, rewards, addReward, updateReward, deleteReward, redeemedRewards, records, events } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('badges');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isGiftDeleteModalOpen, setIsGiftDeleteModalOpen] = useState(false);
  
  // Selection states
  const [badgeToDelete, setBadgeToDelete] = useState<string | null>(null);
  const [giftToDelete, setGiftToDelete] = useState<string | null>(null);
  const [selectedBadgeForUsers, setSelectedBadgeForUsers] = useState<Badge | null>(null);
  const [selectedGiftForUsers, setSelectedGiftForUsers] = useState<Reward | null>(null);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [editingGift, setEditingGift] = useState<Reward | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('all');

  // Badge Form Data
  const [badgeFormData, setBadgeFormData] = useState({
    name: '',
    description: '',
    level: 'Bronze' as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond',
    condition: 1,
    icon: 'Award',
    conditionType: 'donations' as 'donations' | 'events' | 'referrals' | 'active_time',
    isAuto: true,
    isPublic: true
  });

  // Gift Form Data
  const [giftFormData, setGiftFormData] = useState({
    name: '',
    description: '',
    pointsCost: 0,
    imageUrl: '',
    type: 'gift' as 'gift' | 'voucher' | 'badge',
    stock: 0,
    category: 'souvenir' as 'shirt' | 'badge' | 'voucher' | 'souvenir',
    conditionType: 'none' as 'donations' | 'points' | 'event' | 'none',
    conditionValue: 0 as string | number,
    expirationDate: '',
    usageLimit: 0,
    isActive: true
  });

  // Badge Handlers
  const handleOpenBadgeModal = (badge?: Badge) => {
    if (badge) {
      setEditingBadge(badge);
      setBadgeFormData({
        name: badge.name,
        description: badge.description,
        level: badge.level,
        condition: badge.condition,
        icon: badge.icon || 'Award',
        conditionType: badge.conditionType || 'donations',
        isAuto: badge.logicType !== 'manual',
        isPublic: badge.visibility !== 'hidden'
      });
    } else {
      setEditingBadge(null);
      setBadgeFormData({
        name: '',
        description: '',
        level: 'Bronze',
        condition: 1,
        icon: 'Award',
        conditionType: 'donations',
        isAuto: true,
        isPublic: true
      });
    }
    setIsModalOpen(true);
  };

  const handleBadgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: badgeFormData.name,
      description: badgeFormData.description,
      level: badgeFormData.level,
      condition: badgeFormData.condition,
      icon: badgeFormData.icon,
      conditionType: badgeFormData.conditionType,
      logicType: badgeFormData.isAuto ? 'auto' : 'manual' as any,
      visibility: badgeFormData.isPublic ? 'public' : 'hidden' as any,
      status: 'active' as any
    };

    if (editingBadge) {
      updateBadge(editingBadge.id, payload);
    } else {
      addBadge(payload);
    }
    setIsModalOpen(false);
    setEditingBadge(null);
  };

  const handleDeleteBadgeClick = (id: string) => {
    setBadgeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Gift Handlers
  const handleOpenGiftModal = (gift?: Reward) => {
    if (gift) {
      setEditingGift(gift);
      setGiftFormData({
        name: gift.name,
        description: gift.description,
        pointsCost: gift.pointsCost,
        imageUrl: gift.imageUrl,
        type: gift.type,
        stock: gift.stock,
        category: gift.category,
        conditionType: gift.conditionType,
        conditionValue: gift.conditionValue,
        expirationDate: gift.expirationDate || '',
        usageLimit: gift.usageLimit ?? 0,
        isActive: gift.isActive ?? true
      });
    } else {
      setEditingGift(null);
      setGiftFormData({
        name: '',
        description: '',
        pointsCost: 0,
        imageUrl: 'https://picsum.photos/seed/gift/400/300',
        type: 'gift',
        stock: 0,
        category: 'souvenir',
        conditionType: 'none',
        conditionValue: 0,
        expirationDate: '',
        usageLimit: 0,
        isActive: true
      });
    }
    setIsGiftModalOpen(true);
  };

  const handleGiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGift) {
      updateReward(editingGift.id, giftFormData);
    } else {
      addReward(giftFormData);
    }
    setIsGiftModalOpen(false);
    setEditingGift(null);
  };

  const handleDeleteGiftClick = (id: string) => {
    setGiftToDelete(id);
    setIsGiftDeleteModalOpen(true);
  };

  // Helper functions
  const getBadgeCount = (condition: number) => {
    return users.filter(u => u.role === 'donor' && u.donationsCount >= condition).length;
  };

  const getGiftRedemptionCount = (rewardId: string) => {
    return redeemedRewards.filter(r => r.rewardId === rewardId).length;
  };

  const getUsersWithBadge = (condition: number) => {
    return users.filter(u => u.role === 'donor' && u.donationsCount >= condition);
  };

  const getUsersWithGift = (rewardId: string) => {
    const userIds = redeemedRewards.filter(r => r.rewardId === rewardId).map(r => r.userId);
    return users.filter(u => userIds.includes(u.id));
  };

  const filteredGifts = rewards.filter(gift => {
    const matchesSearch = gift.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || gift.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Khen thưởng & Kho quà</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý huy hiệu vinh danh và kho quà tặng cho người hiến máu.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'badges' && (
            <button 
              onClick={() => handleOpenBadgeModal()}
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm px-4 py-2.5 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tạo huy hiệu mới
            </button>
          )}
          {activeTab === 'inventory' && (
            <button 
              onClick={() => handleOpenGiftModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm px-4 py-2.5 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Thêm quà tặng mới
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('badges')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'badges' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" /> Huy hiệu vinh danh
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'inventory' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" /> Kho quà tặng
        </button>
        <button 
          onClick={() => setActiveTab('recipients')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'recipients' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" /> Lịch sử trao thưởng
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'stats' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Thống kê
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.sort((a, b) => a.condition - b.condition).map(badge => {
              const levelData = LEVEL_DATA[badge.level] || { name: badge.level, colorClass: 'text-slate-400', bgClass: 'bg-slate-50', borderClass: 'border-slate-200', tagClass: 'bg-slate-100 text-slate-800', barClass: 'bg-slate-400' };
              const count = getBadgeCount(badge.condition);
              const IconComponent = ICON_MAP[badge.icon] || Award;

              return (
                <div key={badge.id} className={`bg-white rounded-2xl border ${levelData.borderClass} shadow-sm overflow-hidden flex flex-col`}>
                  <div className={`p-6 flex flex-col items-center justify-center text-center ${levelData.bgClass} border-b ${levelData.borderClass}`}>
                    <IconComponent className={`w-16 h-16 ${levelData.colorClass} mb-3`} />
                    <h3 className="text-lg font-bold text-slate-900">{badge.name}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full mt-2 ${levelData.tagClass}`}>
                      Cấp độ: {levelData.name}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-sm text-slate-600 mb-4 flex-1">{badge.description}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Điều kiện:</span>
                        <span className="font-semibold text-slate-900">{badge.condition} lần hiến</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Đã cấp:</span>
                        <button 
                          onClick={() => {
                            setSelectedBadgeForUsers(badge);
                            setIsUsersModalOpen(true);
                          }}
                          className="font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700 hover:underline"
                        >
                          <Users className="w-4 h-4" /> {count} người
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenBadgeModal(badge)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBadgeClick(badge.id)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm quà tặng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
                >
                  <option value="all">Tất cả danh mục</option>
                  <option value="shirt">Áo thun</option>
                  <option value="badge">Huy hiệu vật lý</option>
                  <option value="voucher">Voucher</option>
                  <option value="souvenir">Vật phẩm lưu niệm</option>
                </select>
              </div>
            </div>

            {/* Gift Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGifts.map(gift => (
                <div key={gift.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group">
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={gift.imageUrl || undefined} 
                      alt={gift.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm ${
                        gift.stock > 10 ? 'bg-emerald-100 text-emerald-700' : 
                        gift.stock > 0 ? 'bg-amber-100 text-amber-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        Kho: {gift.stock}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-lg">
                        {gift.category === 'shirt' ? 'Áo thun' : 
                         gift.category === 'badge' ? 'Huy hiệu' : 
                         gift.category === 'voucher' ? 'Voucher' : 'Lưu niệm'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{gift.name}</h3>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2 flex-1">{gift.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Giá đổi:</span>
                        <span className="font-bold text-red-600">{gift.pointsCost} điểm</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Điều kiện:</span>
                        <span className="font-medium text-slate-700">
                          {gift.conditionType === 'donations' ? `${gift.conditionValue} lần hiến` :
                           gift.conditionType === 'points' ? `${gift.conditionValue} điểm tích lũy` :
                           gift.conditionType === 'event' ? 'Sự kiện đặc biệt' : 'Không có'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          setSelectedGiftForUsers(gift);
                          setIsUsersModalOpen(true);
                        }}
                        className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Users className="w-3 h-3" /> {getGiftRedemptionCount(gift.id)} đã nhận
                      </button>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOpenGiftModal(gift)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteGiftClick(gift.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredGifts.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">
                  Không tìm thấy quà tặng nào phù hợp.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recipients Tab */}
        {activeTab === 'recipients' && (
          <div className="space-y-4">
            {/* Smart Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm tên người nhận hoặc email..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select 
                  value={recipientTypeFilter}
                  onChange={(e) => setRecipientTypeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl text-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
                >
                  <option value="all">Tất cả loại quà</option>
                  <option value="Đổi điểm">Đổi điểm</option>
                  <option value="Tại sự kiện">Tại sự kiện</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Người nhận</th>
                      <th className="px-6 py-4">Vật phẩm</th>
                      <th className="px-6 py-4">Loại quà</th>
                      <th className="px-6 py-4">Ngày nhận</th>
                      <th className="px-6 py-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ...redeemedRewards.map(r => ({
                        id: `redeemed-${r.id}`,
                        userId: r.userId,
                        itemName: rewards.find(rw => rw.id === r.rewardId)?.name || 'N/A',
                        type: 'Đổi điểm',
                        date: r.date,
                        status: 'Đã trao'
                      })),
                      ...records.filter(r => r.giftReceived).map(r => ({
                        id: `record-${r.id}`,
                        userId: r.userId,
                        itemName: r.giftType || 'Quà hiến máu',
                        type: 'Tại sự kiện',
                        date: r.giftReceivedDate || r.date,
                        status: 'Đã trao'
                      }))
                    ]
                    .filter(redemption => {
                      const user = users.find(u => u.id === redemption.userId);
                      if (!user) return false;
                      
                      const matchesSearch = 
                        user.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                        user.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                        redemption.itemName.toLowerCase().includes(recipientSearch.toLowerCase());
                      
                      const matchesType = recipientTypeFilter === 'all' || redemption.type === recipientTypeFilter;
                      
                      return matchesSearch && matchesType;
                    })
                    .sort((a, b) => {
                      const dateA = new Date(a.date).getTime();
                      const dateB = new Date(b.date).getTime();
                      if (isNaN(dateA) && isNaN(dateB)) return 0;
                      if (isNaN(dateA)) return 1;
                      if (isNaN(dateB)) return -1;
                      return dateB - dateA;
                    })
                    .map(redemption => {
                      const user = users.find(u => u.id === redemption.userId);
                      if (!user) return null;
                      return (
                        <tr key={redemption.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={user.avatar || undefined} alt={user.name} className="w-8 h-8 rounded-full bg-slate-200" />
                              <div>
                                <p className="font-medium text-slate-900">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">{redemption.itemName}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                              redemption.type === 'Đổi điểm' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {redemption.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">{redemption.date && !isNaN(new Date(redemption.date).getTime()) ? new Date(redemption.date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Đã trao
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {redeemedRewards.length === 0 && records.filter(r => r.giftReceived).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          Chưa có lịch sử trao thưởng nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
                  <Award className="w-5 h-5" />
                </div>
                <p className="text-sm text-slate-500">Tổng huy hiệu đã cấp</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {badges.reduce((acc, b) => acc + getBadgeCount(b.condition), 0)}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Gift className="w-5 h-5" />
                </div>
                <p className="text-sm text-slate-500">Tổng quà tặng đã trao</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {redeemedRewards.length + records.filter(r => r.giftReceived).length}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-sm text-slate-500">Vật phẩm trong kho</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {rewards.reduce((acc, r) => acc + r.stock, 0)}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-sm text-slate-500">Sắp hết hàng</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {rewards.filter(r => r.stock < 5).length}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Phân bổ huy hiệu</h3>
                <div className="space-y-4">
                  {badges.map(badge => {
                    const count = getBadgeCount(badge.condition);
                    const total = badges.reduce((acc, b) => acc + getBadgeCount(b.condition), 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const levelData = LEVEL_DATA[badge.level] || { barClass: 'bg-slate-400' };
                    return (
                      <div key={badge.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700">{badge.name}</span>
                          <span className="text-slate-500">{count} người ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${levelData.barClass}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Quà tặng phổ biến nhất</h3>
                <div className="space-y-4">
                  {rewards.sort((a, b) => getGiftRedemptionCount(b.id) - getGiftRedemptionCount(a.id)).slice(0, 5).map(reward => {
                    const count = getGiftRedemptionCount(reward.id);
                    const total = redeemedRewards.length;
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <div key={reward.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700">{reward.name}</span>
                          <span className="text-slate-500">{count} lượt ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-red-600"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Badge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-50 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <Award className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingBadge ? 'Chỉnh sửa huy hiệu' : 'Tạo huy hiệu mới'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleBadgeSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                
                {/* Section 1: Thông tin chung */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Award className="w-5 h-5 text-red-500" /> Thông tin chung
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Tên huy hiệu</label>
                    <input 
                      type="text" 
                      required
                      value={badgeFormData.name}
                      onChange={(e) => setBadgeFormData({...badgeFormData, name: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow bg-slate-50 focus:bg-white"
                      placeholder="VD: Người hùng hiến máu"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Mô tả ý nghĩa</label>
                    <textarea 
                      required
                      rows={3}
                      value={badgeFormData.description}
                      onChange={(e) => setBadgeFormData({...badgeFormData, description: e.target.value})}
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow bg-slate-50 focus:bg-white resize-none"
                      placeholder="Giải thích ý nghĩa của huy hiệu này..."
                    />
                  </div>
                </div>

                {/* Section 2: Hình thức */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Crown className="w-5 h-5 text-yellow-500" /> Hình thức
                  </h3>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-3">Cấp độ huy hiệu</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { id: 'Silver', name: 'Bạc', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', active: 'ring-slate-500' },
                        { id: 'Bronze', name: 'Đồng', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', active: 'ring-amber-500' },
                        { id: 'Gold', name: 'Vàng', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', active: 'ring-yellow-500' },
                        { id: 'Platinum', name: 'Bạch kim', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200', active: 'ring-cyan-500' },
                        { id: 'Diamond', name: 'Kim cương', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', active: 'ring-violet-500' },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setBadgeFormData({...badgeFormData, level: lvl.id as any})}
                          className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                            badgeFormData.level === lvl.id 
                              ? `${lvl.bg} ${lvl.border} ring-2 ring-offset-1 ${lvl.active}` 
                              : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`text-sm font-bold ${badgeFormData.level === lvl.id ? lvl.color : 'text-slate-600'}`}>
                            {lvl.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-3">Chọn Icon</label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                      {Object.keys(ICON_MAP).map(iconName => {
                        const IconComponent = ICON_MAP[iconName];
                        const isSelected = badgeFormData.icon === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setBadgeFormData({...badgeFormData, icon: iconName})}
                            className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-red-50 border-2 border-red-500 text-red-600 shadow-sm' 
                                : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 3: Điều kiện & Cài đặt */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Activity className="w-5 h-5 text-blue-500" /> Điều kiện & Cấp phát
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Loại điều kiện</label>
                      <select 
                        value={badgeFormData.conditionType}
                        onChange={(e) => setBadgeFormData({...badgeFormData, conditionType: e.target.value as any})}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow bg-white"
                      >
                        <option value="donations">Số lần hiến máu</option>
                        <option value="events">Số sự kiện tham gia</option>
                        <option value="referrals">Số người giới thiệu</option>
                        <option value="active_time">Thời gian hoạt động (tháng)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Giá trị yêu cầu (≥)</label>
                      <input 
                        type="number" 
                        min="1"
                        required
                        value={badgeFormData.condition}
                        onChange={(e) => setBadgeFormData({...badgeFormData, condition: parseInt(e.target.value) || 1})}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <div>
                        <span className="block font-semibold text-slate-900">Tự động cấp huy hiệu</span>
                        <span className="block text-sm text-slate-500 mt-0.5">Hệ thống sẽ tự động cấp khi người dùng đạt đủ điều kiện</span>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={badgeFormData.isAuto}
                          onChange={(e) => setBadgeFormData({...badgeFormData, isAuto: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <div>
                        <span className="block font-semibold text-slate-900">Hiển thị công khai</span>
                        <span className="block text-sm text-slate-500 mt-0.5">Huy hiệu sẽ hiển thị trên hồ sơ người dùng và bảng xếp hạng</span>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={badgeFormData.isPublic}
                          onChange={(e) => setBadgeFormData({...badgeFormData, isPublic: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              <div className="p-6 flex justify-end gap-3 border-t border-slate-200 shrink-0 bg-white">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {editingBadge ? 'Lưu thay đổi' : 'Tạo huy hiệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      {isGiftModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">
                {editingGift ? 'Chỉnh sửa quà tặng' : 'Thêm quà tặng mới'}
              </h2>
              <button onClick={() => setIsGiftModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGiftSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên quà tặng</label>
                    <input 
                      type="text" 
                      required
                      value={giftFormData.name}
                      onChange={(e) => setGiftFormData({...giftFormData, name: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="VD: Áo thun Máu+"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                    <textarea 
                      required
                      rows={2}
                      value={giftFormData.description}
                      onChange={(e) => setGiftFormData({...giftFormData, description: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Mô tả chi tiết vật phẩm..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại</label>
                    <select 
                      value={giftFormData.type}
                      onChange={(e) => setGiftFormData({...giftFormData, type: e.target.value as any})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="gift">Vật phẩm</option>
                      <option value="voucher">Voucher</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                    <select 
                      value={giftFormData.category}
                      onChange={(e) => setGiftFormData({...giftFormData, category: e.target.value as any})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="shirt">Áo thun</option>
                      <option value="badge">Huy hiệu</option>
                      <option value="voucher">Voucher</option>
                      <option value="souvenir">Lưu niệm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giá đổi (điểm)</label>
                    <input 
                      type="number" 
                      min="0"
                      required
                      value={giftFormData.pointsCost}
                      onChange={(e) => setGiftFormData({...giftFormData, pointsCost: parseInt(e.target.value) || 0})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng trong kho</label>
                    <input 
                      type="number" 
                      min="0"
                      required
                      value={giftFormData.stock}
                      onChange={(e) => setGiftFormData({...giftFormData, stock: parseInt(e.target.value) || 0})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hết hạn</label>
                    <input 
                      type="date" 
                      value={giftFormData.expirationDate}
                      onChange={(e) => setGiftFormData({...giftFormData, expirationDate: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số lượt dùng tối đa</label>
                    <input 
                      type="number" 
                      min="0"
                      value={giftFormData.usageLimit}
                      onChange={(e) => setGiftFormData({...giftFormData, usageLimit: parseInt(e.target.value) || 0})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={giftFormData.isActive}
                      onChange={(e) => setGiftFormData({...giftFormData, isActive: e.target.checked})}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                    />
                    <label className="text-sm font-medium text-slate-700">Kích hoạt voucher</label>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">URL hình ảnh</label>
                    <input 
                      type="url" 
                      required
                      value={giftFormData.imageUrl}
                      onChange={(e) => setGiftFormData({...giftFormData, imageUrl: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="col-span-2 pt-2">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Điều kiện nhận quà</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Loại điều kiện</label>
                        <select 
                          value={giftFormData.conditionType}
                          onChange={(e) => {
                            const newType = e.target.value as any;
                            setGiftFormData(prev => ({
                              ...prev,
                              conditionType: newType,
                              conditionValue: newType === 'none' ? 0 : prev.conditionValue
                            }));
                          }}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="none">Không có</option>
                          <option value="donations">Số lần hiến máu</option>
                          <option value="points">Điểm tích lũy</option>
                          <option value="event">Sự kiện đặc biệt</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Giá trị yêu cầu</label>
                        <input 
                          type="text" 
                          value={giftFormData.conditionValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGiftFormData(prev => ({
                              ...prev,
                              conditionValue: prev.conditionType === 'event' ? val : (isNaN(Number(val)) ? val : Number(val))
                            }));
                          }}
                          disabled={giftFormData.conditionType === 'none'}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
                          placeholder="VD: 3"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4 flex justify-end gap-3 border-t border-slate-100 shrink-0 bg-slate-50">
                <button 
                  type="button"
                  onClick={() => setIsGiftModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                >
                  {editingGift ? 'Cập nhật' : 'Thêm quà'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List Modal (for both Badges and Gifts) */}
      {isUsersModalOpen && (selectedBadgeForUsers || selectedGiftForUsers) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Danh sách người nhận {selectedBadgeForUsers ? 'huy hiệu' : 'quà tặng'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Vật phẩm: <span className="font-semibold text-slate-700">
                    {selectedBadgeForUsers ? selectedBadgeForUsers.name : selectedGiftForUsers?.name}
                  </span>
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsUsersModalOpen(false);
                  setSelectedBadgeForUsers(null);
                  setSelectedGiftForUsers(null);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {((selectedBadgeForUsers ? getUsersWithBadge(selectedBadgeForUsers.condition) : getUsersWithGift(selectedGiftForUsers!.id))).length > 0 ? (
                <div className="space-y-3">
                  {(selectedBadgeForUsers ? getUsersWithBadge(selectedBadgeForUsers.condition) : getUsersWithGift(selectedGiftForUsers!.id)).map(user => (
                    <div key={user.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <img src={user.avatar || undefined} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{user.name}</h4>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-slate-900">
                          {selectedBadgeForUsers ? `${user.donationsCount} lần hiến` : `${user.points || 0} điểm`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Chưa có người dùng nào nhận vật phẩm này.
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button 
                onClick={() => {
                  setIsUsersModalOpen(false);
                  setSelectedBadgeForUsers(null);
                  setSelectedGiftForUsers(null);
                }}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (badgeToDelete) deleteBadge(badgeToDelete);
          setIsDeleteModalOpen(false);
          setBadgeToDelete(null);
        }}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa huy hiệu này không? Hành động này không thể hoàn tác."
        confirmText="Xóa huy hiệu"
        cancelText="Hủy"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={isGiftDeleteModalOpen}
        onClose={() => setIsGiftDeleteModalOpen(false)}
        onConfirm={() => {
          if (giftToDelete) deleteReward(giftToDelete);
          setIsGiftDeleteModalOpen(false);
          setGiftToDelete(null);
        }}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa quà tặng này không? Hành động này không thể hoàn tác."
        confirmText="Xóa quà tặng"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
};

