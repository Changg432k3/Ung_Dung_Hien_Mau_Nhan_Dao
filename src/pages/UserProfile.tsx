import React, { useState, useEffect, useMemo } from 'react';
import { useApp, BloodGroup } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Award, Droplets, Calendar, User as UserIcon, MapPin, 
  Phone, Mail, Edit2, Save, X, Info, CheckCircle, 
  Clock, FileText, Heart, Activity, TrendingUp, 
  ChevronRight, Share2, Download, ExternalLink, History,
  ArrowUpRight, ArrowDownLeft, Target, Star, Zap,
  Shield, Droplet, QrCode, Crown, Medal
} from 'lucide-react';
import { format, parseISO, addMonths, isAfter, differenceInDays, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AnimatePresence, motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area,
  RadialBarChart, RadialBar
} from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const ICON_MAP: Record<string, React.ElementType> = {
  Award, Star, Heart, Shield, Zap, Droplet, Activity, TrendingUp, Medal, Crown
};

const LEVEL_DATA: Record<string, { name: string, colorClass: string, bgClass: string, borderClass: string, tagClass: string, barClass: string, gradientClass: string }> = {
  Silver: { name: 'Bạc', colorClass: 'text-slate-700', bgClass: 'bg-slate-50', borderClass: 'border-slate-200', tagClass: 'bg-slate-200 text-slate-800', barClass: 'bg-slate-400', gradientClass: 'from-slate-100 to-slate-200 text-slate-600' },
  Bronze: { name: 'Đồng', colorClass: 'text-amber-700', bgClass: 'bg-amber-50', borderClass: 'border-amber-200', tagClass: 'bg-amber-100 text-amber-800', barClass: 'bg-amber-700', gradientClass: 'from-amber-100 to-amber-200 text-amber-700' },
  Gold: { name: 'Vàng', colorClass: 'text-yellow-600', bgClass: 'bg-yellow-50', borderClass: 'border-yellow-200', tagClass: 'bg-yellow-100 text-yellow-800', barClass: 'bg-yellow-500', gradientClass: 'from-yellow-100 to-yellow-200 text-yellow-600' },
  Platinum: { name: 'Bạch kim', colorClass: 'text-cyan-700', bgClass: 'bg-cyan-50', borderClass: 'border-cyan-200', tagClass: 'bg-cyan-100 text-cyan-800', barClass: 'bg-cyan-500', gradientClass: 'from-cyan-100 to-cyan-200 text-cyan-600' },
  Diamond: { name: 'Kim cương', colorClass: 'text-violet-700', bgClass: 'bg-violet-50', borderClass: 'border-violet-200', tagClass: 'bg-violet-100 text-violet-800', barClass: 'bg-violet-500', gradientClass: 'from-violet-100 to-violet-200 text-violet-600' },
};

export const UserProfile: React.FC = () => {
  const { currentUser, records, badges, certificates, certificateTemplates, events, users, updateUser, markBadgeAsSeen } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female' | 'other',
    medicalInfo: '',
    bloodGroup: 'Chưa xác định' as BloodGroup
  });

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name,
        phone: currentUser.phone || '0901234567',
        address: currentUser.address || 'TP. Hồ Chí Minh',
        birthDate: currentUser.birthDate || '1995-01-01',
        gender: currentUser.gender || 'male',
        medicalInfo: currentUser.medicalInfo || '',
        bloodGroup: currentUser.bloodGroup || 'Chưa xác định'
      });
      
      // Mark all earned badges as seen when visiting the profile
      const earnedBadges = badges.filter(b => currentUser.donationsCount >= b.condition);
      const unseenBadges = earnedBadges.filter(b => !currentUser.seenBadges?.includes(b.id));
      
      if (unseenBadges.length > 0) {
        const newSeenBadges = [...(currentUser.seenBadges || []), ...unseenBadges.map(b => b.id)];
        updateUser(currentUser.id, { seenBadges: newSeenBadges });
      }
    }
  }, [currentUser, badges, updateUser]);

  const communityBloodTypeData = useMemo(() => {
    let bloodGroupCounts = users.reduce((acc, user) => {
      if (user.bloodGroup) {
        acc[user.bloodGroup] = (acc[user.bloodGroup] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const allBloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Chưa xác định'];
    let totalUsersWithBloodGroup = allBloodGroups.reduce((sum, bg) => sum + (bloodGroupCounts[bg] || 0), 0);
    
    // Fallback to realistic Vietnam distribution if no data (e.g. for donors who can't read all users)
    if (totalUsersWithBloodGroup === 0) {
      bloodGroupCounts = {
        'O+': 42,
        'O-': 3,
        'A+': 24,
        'A-': 1,
        'B+': 19,
        'B-': 1,
        'AB+': 9,
        'AB-': 1,
        'Chưa xác định': 0
      };
      totalUsersWithBloodGroup = 100;
    }

    const colors = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#6366f1', '#94a3b8'];
    
    return allBloodGroups.map((bg, index) => ({
      name: `Nhóm ${bg}`,
      value: Math.round(((bloodGroupCounts[bg] || 0) / totalUsersWithBloodGroup) * 100),
      count: bloodGroupCounts[bg] || 0,
      color: colors[index]
    }));
  }, [users]);

  if (!currentUser) return null;

  const handleSaveProfile = () => {
    updateUser(currentUser.id, editForm);
    setIsEditing(false);
  };

  const handleEditAvatar = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          updateUser(currentUser.id, { avatar: base64String });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const getDonationEligibility = () => {
    if (currentUser.isLocked) return { eligible: false, reason: 'Tài khoản của bạn đang bị khóa. Vui lòng liên hệ quản trị viên.' };
    if (!currentUser.lastDonationDate) return { eligible: true, reason: 'Bạn đã sẵn sàng để hiến máu lần đầu tiên!' };
    
    const lastDate = parseISO(currentUser.lastDonationDate);
    if (!isValid(lastDate)) return { eligible: true, reason: 'Bạn đã sẵn sàng để hiến máu lần đầu tiên!' };
    const nextDate = addMonths(lastDate, 3);
    const now = new Date();
    
    const eligible = isAfter(now, nextDate) || now.getTime() === nextDate.getTime();
    
    if (!eligible) {
      const daysRemaining = Math.max(0, differenceInDays(nextDate, now));
      return { 
        eligible: false, 
        reason: `Bạn cần nghỉ ngơi thêm ${daysRemaining} ngày trước lần hiến tiếp theo.`,
        daysRemaining
      };
    }
    
    return { eligible: true, reason: 'Bạn đã đủ điều kiện để tiếp tục hiến máu!' };
  };

  const eligibility = getDonationEligibility();

  const myRecords = records.filter(r => r.userId === currentUser.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const completedRecords = myRecords.filter(r => r.status === 'completed');
  const donationCount = completedRecords.length;
  const totalAmount = completedRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const livesSaved = donationCount * 3;

  // Calculate donation history by year
  const donationHistoryByYear = completedRecords.reduce((acc, record) => {
    const year = new Date(record.date).getFullYear().toString();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const currentYear = new Date().getFullYear();
  let donationHistoryData = Array.from({ length: 5 }, (_, i) => {
    const year = (currentYear - 4 + i).toString();
    return {
      year,
      count: donationHistoryByYear[year] || 0
    };
  });

  if (completedRecords.length === 0) {
    donationHistoryData = [
      { year: (currentYear - 4).toString(), count: 1 },
      { year: (currentYear - 3).toString(), count: 2 },
      { year: (currentYear - 2).toString(), count: 1 },
      { year: (currentYear - 1).toString(), count: 3 },
      { year: currentYear.toString(), count: 2 }
    ];
  }

  const getBadgeName = (count: number) => {
    const earnedBadges = badges.filter(b => count >= b.condition).sort((a, b) => b.condition - a.condition);
    if (earnedBadges.length > 0) {
      return earnedBadges[0].name;
    }
    return 'Chưa có huy hiệu';
  };

  const myCertificates = certificates.filter(c => c.userId === currentUser.id);

  const bloodCompatibility = useMemo(() => {
    const group = currentUser.bloodGroup;
    if (!group) return null;

    const canGiveTo: Record<string, string[]> = {
      'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      'O+': ['O+', 'A+', 'B+', 'AB+'],
      'A-': ['A-', 'A+', 'AB-', 'AB+'],
      'A+': ['A+', 'AB+'],
      'B-': ['B-', 'B+', 'AB-', 'AB+'],
      'B+': ['B+', 'AB+'],
      'AB-': ['AB-', 'AB+'],
      'AB+': ['AB+']
    };

    const canReceiveFrom: Record<string, string[]> = {
      'O-': ['O-'],
      'O+': ['O-', 'O+'],
      'A-': ['O-', 'A-'],
      'A+': ['O-', 'O+', 'A-', 'A+'],
      'B-': ['O-', 'B-'],
      'B+': ['O-', 'O+', 'B-', 'B+'],
      'AB-': ['O-', 'A-', 'B-', 'AB-'],
      'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    };

    return {
      give: canGiveTo[group] || [],
      receive: canReceiveFrom[group] || []
    };
  }, [currentUser.bloodGroup]);

  const nextBadge = useMemo(() => {
    const sortedBadges = [...badges].sort((a, b) => a.condition - b.condition);
    return sortedBadges.find(b => b.condition > donationCount);
  }, [badges, donationCount]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Premium Header Banner */}
      <div className="relative h-[300px] sm:h-[380px] w-full overflow-hidden bg-[#0a0a0a]">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-red-600/20 blur-[120px]" />
          <div className="absolute bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-rose-600/20 blur-[100px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        </div>

        {/* Content Container */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-full blur opacity-40 group-hover:opacity-60 transition duration-500"></div>
            <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-[#0a0a0a] relative z-10 shadow-2xl">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} className="object-cover" />
              <AvatarFallback className="bg-slate-800 text-white text-4xl font-bold">
                {currentUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <button 
                onClick={handleEditAvatar}
                className="absolute bottom-2 right-2 p-2.5 bg-white rounded-full shadow-xl text-slate-700 hover:text-red-600 hover:scale-110 transition-all z-20"
                title="Đổi ảnh đại diện"
              >
                <Edit2 className="w-4 h-4" />
              </button>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mt-6"
          >
            <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
              {currentUser.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <Badge className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-medium rounded-full">
                <Droplet className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                Nhóm máu: {currentUser.bloodGroup || 'Chưa cập nhật'}
              </Badge>
              <Badge className="bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-medium rounded-full">
                <Award className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                {getBadgeName(donationCount)}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md rounded-full px-4 h-8"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Đã sao chép liên kết hồ sơ!');
                }}
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Chia sẻ
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar - Stats & Info */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Digital Blood Donation Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 p-6 text-white shadow-lg border border-red-500/30">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black/10 rounded-full blur-xl" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-red-100 text-xs font-bold uppercase tracking-widest mb-1">Thẻ hiến máu điện tử</p>
                      <h3 className="text-xl font-bold">Máu+ ID</h3>
                    </div>
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                      <Droplet className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-white p-2 rounded-xl shadow-inner">
                      <QRCodeSVG 
                        value={`bloodlink:user:${currentUser.id}`} 
                        size={64} 
                        bgColor={"#ffffff"} 
                        fgColor={"#000000"} 
                        level={"M"} 
                      />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight">{currentUser.name}</p>
                      <p className="text-red-100 text-sm mt-1">{currentUser.phone || 'Chưa cập nhật SĐT'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold backdrop-blur-sm">
                          {currentUser.bloodGroup || 'Chưa rõ'}
                        </span>
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold backdrop-blur-sm">
                          {donationCount} lần
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/20 flex justify-between items-center text-xs text-red-100">
                    <span>ID: {currentUser.id.substring(0, 8).toUpperCase()}</span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Xác thực
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bento Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                  <Heart className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{donationCount}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Lần hiến</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <Droplets className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{totalAmount}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">ml Máu</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-sm text-white relative overflow-hidden group"
              >
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-50 uppercase tracking-wider mb-1">Ước tính cứu sống</p>
                    <p className="text-4xl font-bold">{livesSaved} <span className="text-xl font-medium text-emerald-100">người</span></p>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Points Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium mb-1">Điểm tích lũy</p>
                      <h2 className="text-4xl font-bold text-slate-900">{currentUser?.points || 0}</h2>
                    </div>
                    <div className="w-24 h-24 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                          cx="50%" 
                          cy="50%" 
                          innerRadius="70%" 
                          outerRadius="100%" 
                          barSize={8} 
                          data={[{ name: 'Tiến độ', value: ((currentUser?.points || 0) % 1000) / 1000 * 100 }]}
                          startAngle={90}
                          endAngle={-270}
                        >
                          <RadialBar
                            background={{ fill: '#f1f5f9' }}
                            dataKey="value"
                            cornerRadius={30}
                            fill="#f59e0b"
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Award className="w-6 h-6 text-amber-500" />
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-center">
                    Tiến độ đến cấp tiếp theo: <span className="font-bold text-slate-900">{(currentUser?.points || 0) % 1000} / 1000</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Eligibility Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden">
                <div className={`p-6 ${eligibility.eligible ? 'bg-emerald-50/50' : 'bg-amber-50/50'}`}>
                  <div className="flex gap-4 items-start">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${eligibility.eligible ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {eligibility.eligible ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${eligibility.eligible ? 'text-emerald-900' : 'text-amber-900'}`}>
                        {eligibility.eligible ? 'Đủ điều kiện hiến máu' : 'Chưa đủ điều kiện'}
                      </h3>
                      <p className={`text-sm mt-1 ${eligibility.eligible ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {eligibility.reason}
                      </p>
                      {eligibility.eligible && (
                        <Button asChild size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">
                          <Link to="/events">Đặt lịch ngay</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Blood Compatibility */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="rounded-3xl shadow-sm border-slate-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-500" />
                    Tương thích nhóm máu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {bloodCompatibility ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                          Có thể hiến cho
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {bloodCompatibility.give.map((bg, index) => (
                            <span key={`give-${bg}-${index}`} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200">
                              {bg}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <ArrowDownLeft className="w-4 h-4 text-blue-500" />
                          Có thể nhận từ
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {bloodCompatibility.receive.map((bg, index) => (
                            <span key={`receive-${bg}-${index}`} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200">
                              {bg}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-xl">Cập nhật nhóm máu để xem thông tin tương thích.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 mb-8 inline-flex h-auto">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
                >
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
                >
                  Lịch sử hiến máu
                </TabsTrigger>
                <TabsTrigger 
                  value="achievements" 
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
                >
                  Thành tích
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="overview" className="space-y-8 outline-none mt-0">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    {/* Quick Actions - Modern Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <Link to="/events" className="group flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Calendar className="w-5 h-5 text-red-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Tìm sự kiện</span>
                      </Link>
                      <Link to="/rewards" className="group flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Star className="w-5 h-5 text-blue-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Đổi quà</span>
                      </Link>
                      <Link to="/community" className="group flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Share2 className="w-5 h-5 text-amber-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Cộng đồng</span>
                      </Link>
                      <Link to="/game" className="group flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Zap className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Thử thách</span>
                      </Link>
                    </div>

                    {/* Personal Info Card */}
                    <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-bold">Thông tin cá nhân</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="rounded-full bg-white">
                          {isEditing ? <><X className="w-4 h-4 mr-2" /> Hủy</> : <><Edit2 className="w-4 h-4 mr-2" /> Chỉnh sửa</>}
                        </Button>
                      </CardHeader>
                      <CardContent className="p-6">
                        {isEditing ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Họ và tên</label>
                              <input 
                                type="text" 
                                value={editForm.name} 
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</label>
                              <input 
                                type="text" 
                                value={editForm.phone} 
                                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ</label>
                              <input 
                                type="text" 
                                value={editForm.address} 
                                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhóm máu</label>
                              <select 
                                value={editForm.bloodGroup} 
                                onChange={(e) => setEditForm({...editForm, bloodGroup: e.target.value as BloodGroup})}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                              >
                                <option value="Chưa xác định">Chưa xác định</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                              </select>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin y tế</label>
                              <textarea 
                                rows={3}
                                value={editForm.medicalInfo} 
                                onChange={(e) => setEditForm({...editForm, medicalInfo: e.target.value})}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white resize-none"
                              />
                            </div>
                            <div className="sm:col-span-2 flex justify-end gap-3 mt-4">
                              <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-full px-8">
                                Hủy
                              </Button>
                              <Button onClick={handleSaveProfile} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8">
                                <Save className="w-4 h-4 mr-2" /> Lưu thay đổi
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <Mail className="w-5 h-5 text-slate-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                <p className="text-slate-900 font-medium">{currentUser.email}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <Phone className="w-5 h-5 text-slate-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Số điện thoại</p>
                                <p className="text-slate-900 font-medium">{currentUser.phone || 'Chưa cập nhật'}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5 text-slate-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Địa chỉ</p>
                                <p className="text-slate-900 font-medium">{currentUser.address || 'Chưa cập nhật'}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 text-slate-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày sinh</p>
                                <p className="text-slate-900 font-medium">{currentUser.birthDate && !isNaN(new Date(currentUser.birthDate).getTime()) ? format(new Date(currentUser.birthDate), 'dd/MM/yyyy') : 'Chưa cập nhật'}</p>
                              </div>
                            </div>
                            <div className="sm:col-span-2 flex items-start gap-4 pt-4 border-t border-slate-100">
                              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <Activity className="w-5 h-5 text-red-500" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Thông tin y tế</p>
                                <p className="text-slate-700 leading-relaxed">
                                  {currentUser.medicalInfo || 'Không có ghi chú y tế đặc biệt.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="rounded-3xl shadow-sm border-slate-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-bold">Xu hướng hiến máu</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={donationHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis hide domain={[0, 'dataMax + 2']} allowDecimals={false} />
                                <RechartsTooltip 
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="count" 
                                  stroke="#ef4444" 
                                  strokeWidth={3}
                                  fillOpacity={1} 
                                  fill="url(#colorCount)" 
                                  animationDuration={1500}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-3xl shadow-sm border-slate-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-bold">Nhóm máu cộng đồng</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={communityBloodTypeData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={65}
                                  outerRadius={85}
                                  paddingAngle={5}
                                  dataKey="value"
                                  animationDuration={1500}
                                  stroke="none"
                                >
                                  {communityBloodTypeData.map((entry, index) => (
                                    <Cell key={`cell-profile-blood-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                  itemStyle={{ color: '#0f172a' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="history" className="outline-none mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {myRecords.length > 0 ? (
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        {myRecords.map((record, index) => {
                          const event = events.find(e => e.id === record.eventId);
                          return (
                            <div key={record.id} className={`p-6 flex flex-col sm:flex-row sm:items-center gap-5 hover:bg-slate-50 transition-colors ${index !== myRecords.length - 1 ? 'border-b border-slate-100' : ''}`}>
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                record.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                                record.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                <Droplets className="w-7 h-7" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-bold text-slate-900 text-lg">
                                    {event?.title || 'Sự kiện hiến máu'}
                                  </h3>
                                  <Badge className={`rounded-full px-3 py-1 font-medium ${
                                    record.status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 
                                    record.status === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}>
                                    {record.status === 'completed' ? 'Hoàn thành' : 
                                     record.status === 'cancelled' ? 'Đã hủy' : 
                                     record.status === 'checked-in' ? 'Đã điểm danh' : 'Đã đăng ký'}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {record.date && !isNaN(new Date(record.date).getTime()) ? format(new Date(record.date), 'dd/MM/yyyy') : 'Chưa cập nhật'}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    {event?.address || 'Địa điểm hiến máu'}
                                  </span>
                                  {record.amount && (
                                    <span className="flex items-center gap-1.5 text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                      <Activity className="w-4 h-4 text-red-500" />
                                      {record.amount}ml
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="hidden sm:flex items-center justify-center w-10">
                                <ChevronRight className="w-5 h-5 text-slate-300" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <History className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Chưa có lịch sử hiến máu</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                          Hãy bắt đầu hành trình nhân đạo của bạn bằng cách đăng ký tham gia các sự kiện hiến máu.
                        </p>
                        <Button asChild className="mt-8 bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8">
                          <Link to="/events">Tìm sự kiện ngay</Link>
                        </Button>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent value="achievements" className="outline-none mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-10"
                  >
                    {/* Badges Section */}
                    <div id="badges">
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6 text-amber-500" />
                        Huy hiệu đạt được
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {[...badges].sort((a, b) => a.condition - b.condition)
                          .slice(0, showAllBadges ? badges.length : 3)
                          .map((badge, index) => {
                          const isEarned = donationCount >= badge.condition;
                          const earnedRecord = currentUser.earnedBadges?.find(b => b.badgeId === badge.id);
                          const progress = Math.min(100, (donationCount / badge.condition) * 100);
                          const levelData = LEVEL_DATA[badge.level] || { name: badge.level, colorClass: 'text-slate-400', bgClass: 'bg-slate-50', borderClass: 'border-slate-200', tagClass: 'bg-slate-100 text-slate-800', barClass: 'bg-slate-400', gradientClass: 'from-slate-100 to-slate-200 text-slate-600' };
                          const IconComponent = ICON_MAP[badge.icon] || Award;
                          
                          return (
                            <Card key={`${badge.id}-${index}`} className={`rounded-3xl border-slate-100 overflow-hidden transition-all duration-300 ${isEarned ? 'bg-white shadow-md hover:-translate-y-1' : 'bg-slate-50/50 shadow-sm'}`}>
                              <CardContent className="p-8 flex flex-col items-center text-center">
                                <div className={`relative mb-6 ${isEarned ? '' : 'grayscale opacity-30'}`}>
                                  <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-inner bg-gradient-to-br ${levelData.gradientClass}`}>
                                    <IconComponent className="w-12 h-12" />
                                  </div>
                                  {isEarned && (
                                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg border-2 border-white">
                                      <CheckCircle className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                                
                                <Badge className={`mb-2 ${levelData.tagClass}`}>
                                  {levelData.name}
                                </Badge>
                                <h3 className="font-bold text-slate-900 text-lg mb-2">{badge.name}</h3>
                                <p className="text-sm text-slate-500 mb-2 leading-relaxed">{badge.description}</p>
                                <p className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full mb-4">
                                  {badge.conditionType === 'donations' ? `Hiến ${badge.condition} lần` : 
                                   badge.conditionType === 'events' ? `Tham gia ${badge.condition} sự kiện` :
                                   badge.conditionType === 'referrals' ? `Giới thiệu ${badge.condition} người` :
                                   `Hoạt động ${badge.condition} giờ`}
                                </p>
                                
                                {isEarned && earnedRecord && (
                                  <p className="text-xs text-slate-400 mb-4">
                                    Đạt được ngày: {earnedRecord.dateAwarded && !isNaN(new Date(earnedRecord.dateAwarded).getTime()) ? format(new Date(earnedRecord.dateAwarded), 'dd/MM/yyyy') : 'Chưa cập nhật'}
                                  </p>
                                )}

                                <div className="w-full space-y-2 mt-auto">
                                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                    <span className={isEarned ? 'text-emerald-600' : 'text-slate-400'}>
                                      {isEarned ? 'Đã đạt được' : 'Tiến độ'}
                                    </span>
                                    <span className="text-slate-900">{donationCount}/{badge.condition}</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      transition={{ duration: 1, delay: 0.2 }}
                                      className={`h-full rounded-full ${
                                        isEarned ? 'bg-emerald-500' : 'bg-slate-300'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      {badges.length > 3 && (
                        <div className="flex justify-center mt-6">
                            <Button variant="outline" onClick={() => setShowAllBadges(!showAllBadges)} className="rounded-full px-6">
                                {showAllBadges ? 'Thu gọn' : 'Xem thêm'}
                            </Button>
                        </div>
                      )}
                    </div>

                    {/* Certificates Section */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-500" />
                        Chứng nhận điện tử
                      </h3>
                      
                      {myCertificates.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {myCertificates.map(cert => {
                            const template = certificateTemplates.find(t => t.id === cert.templateId);
                            const event = events.find(e => e.id === cert.eventId);
                            return (
                              <Card key={cert.id} className="rounded-3xl shadow-sm border-slate-100 hover:shadow-md transition-all overflow-hidden group">
                                <div className="h-40 bg-slate-900 relative overflow-hidden">
                                  <img 
                                    src={template?.backgroundUrl || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400'} 
                                    className="w-full h-full object-cover opacity-50 group-hover:scale-105 group-hover:opacity-60 transition-all duration-700"
                                    alt="Certificate Background"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                    <p className="text-white font-bold text-lg leading-tight mb-1">{template?.name || 'Chứng nhận hiến máu'}</p>
                                    <p className="text-slate-300 text-sm flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5" />
                                      Cấp ngày: {cert.issueDate && !isNaN(new Date(cert.issueDate).getTime()) ? format(new Date(cert.issueDate), 'dd/MM/yyyy') : 'Chưa cập nhật'}
                                    </p>
                                  </div>
                                </div>
                                <CardContent className="p-6">
                                  <div className="flex justify-between items-center mb-6">
                                    <div className="flex-1 pr-4">
                                      <p className="text-sm font-medium text-slate-900 line-clamp-2">{event?.title}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-slate-200 hover:bg-slate-50">
                                        <Share2 className="w-4 h-4 text-slate-600" />
                                      </Button>
                                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-slate-200 hover:bg-slate-50">
                                        <Download className="w-4 h-4 text-slate-600" />
                                      </Button>
                                    </div>
                                  </div>
                                  <Button asChild variant="outline" className="w-full rounded-xl border-slate-200 hover:bg-slate-50 hover:text-slate-900">
                                    <Link to={`/verify/${cert.id}`}>
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      Xem chi tiết & Xác minh
                                    </Link>
                                  </Button>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-slate-500 font-medium">Bạn chưa nhận được chứng nhận nào.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};