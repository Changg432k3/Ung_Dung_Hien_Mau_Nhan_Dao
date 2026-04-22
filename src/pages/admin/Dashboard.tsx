import React, { useMemo } from 'react';
import { 
  CalendarDays, 
  Users, 
  CheckCircle2, 
  Droplet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Bell,
  Clock,
  MapPin,
  Award,
  ChevronRight,
  Activity,
  Map as MapIcon,
  Info,
  Download,
  PieChart as PieChartIcon,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { useApp, BloodGroup, EmergencyCall, Event } from '../../store/AppContext';
import { format, parseISO, subDays, isAfter, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { EventMap } from '../../components/EventMap';
import { VIETNAM_PROVINCES } from '../../constants/provinces';
import { Filter } from 'lucide-react';
import { motion } from 'motion/react';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CRITICAL_THRESHOLD = 2000;

export const AdminDashboard: React.FC = () => {
  const { events, records, users, emergencyCalls, resolveEmergencyCall, addEvent, addNotification, addCommunityPost, currentUser } = useApp();
  const navigate = useNavigate();

  const [regionFilter, setRegionFilter] = React.useState<string>('');
  const [detailsModal, setDetailsModal] = React.useState<{title: string, type: string} | null>(null);

  const [showEmergencyEventModal, setShowEmergencyEventModal] = React.useState<{group: string} | null>(null);
  const [emergencyEventData, setEmergencyEventData] = React.useState({
    title: '',
    location: 'Bệnh viện Truyền máu Huyết học',
    address: '118 Hồng Bàng, Q.5, TP.HCM',
    lat: 10.754,
    lng: 106.663,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    time: '07:00 - 16:00',
    target: 50,
    bloodGroup: ''
  });

  const [showCampaignModal, setShowCampaignModal] = React.useState<{group: string} | null>(null);
  const [campaignData, setCampaignData] = React.useState({
    message: '',
    bloodGroup: '',
    region: 'Hà Nội',
    sendNotification: true,
    postToCommunity: true
  });

  React.useEffect(() => {
    if (showEmergencyEventModal) {
      setEmergencyEventData(prev => ({
        ...prev,
        title: `Hiến máu khẩn cấp nhóm ${showEmergencyEventModal.group}`,
        bloodGroup: showEmergencyEventModal.group
      }));
    }
  }, [showEmergencyEventModal]);

  React.useEffect(() => {
    if (showCampaignModal) {
      setCampaignData(prev => ({
        ...prev,
        bloodGroup: showCampaignModal.group,
        message: `🚨 Khẩn cấp: Cần nhóm máu ${showCampaignModal.group} tại Hà Nội`
      }));
    }
  }, [showCampaignModal]);

  const handleCreateEmergencyEvent = () => {
    if (!emergencyEventData.title || !emergencyEventData.startDate || !emergencyEventData.location) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    addEvent({
      title: emergencyEventData.title,
      date: emergencyEventData.startDate,
      startDate: emergencyEventData.startDate,
      endDate: emergencyEventData.startDate,
      time: emergencyEventData.time,
      location: emergencyEventData.location,
      address: emergencyEventData.address,
      lat: emergencyEventData.lat,
      lng: emergencyEventData.lng,
      organizer: 'Bệnh viện Truyền máu Huyết học',
      target: emergencyEventData.target,
      category: 'urgent',
      description: `Cần gấp nhóm máu ${emergencyEventData.bloodGroup} để cấp cứu bệnh nhân. Mong mọi người hỗ trợ!`,
      region: 'Hồ Chí Minh'
    });
    toast.success('Đã tạo sự kiện khẩn cấp thành công!');
    setShowEmergencyEventModal(null);
  };

  const handleCreateCampaign = () => {
    if (campaignData.postToCommunity && currentUser) {
      addCommunityPost({
        userId: currentUser.id,
        content: campaignData.message,
        type: 'story',
      });
    }
    
    if (campaignData.sendNotification) {
      const targetUsers = users.filter(u => u.role === 'donor' && (u.bloodGroup === campaignData.bloodGroup || !campaignData.bloodGroup));
      targetUsers.forEach(u => {
        addNotification({
          userId: u.id,
          title: 'Cảnh báo khẩn cấp',
          message: campaignData.message,
          type: 'emergency',
          bloodGroup: campaignData.bloodGroup as BloodGroup
        });
      });
    }
    
    toast.success('Đã gửi thông báo chiến dịch thành công!');
    setShowCampaignModal(null);
  };

  const filteredEvents = useMemo(() => {
    if (!regionFilter) return events;
    return events.filter(e => e.region === regionFilter);
  }, [events, regionFilter]);

  const activeEmergencyCalls = emergencyCalls.filter(c => c.status === 'active');

  // 1. System Alerts
  const systemAlerts = useMemo(() => {
    const alerts: any[] = [];
    
    // Blood shortage
    const collected = records
      .filter(r => r.status === 'completed')
      .reduce((acc, record) => {
        acc[record.bloodGroup] = (acc[record.bloodGroup] || 0) + record.amount;
        return acc;
      }, {} as Record<string, number>);

    const usage = {
      'A+': 1200, 'A-': 400, 'B+': 800, 'B-': 300,
      'AB+': 200, 'AB-': 100, 'O+': 1500, 'O-': 600
    } as Record<string, number>;

    BLOOD_GROUPS.forEach(group => {
      const stock = Math.max(0, (collected[group] || 0) - (usage[group] || 0));
      if (stock < CRITICAL_THRESHOLD) {
        const isCritical = stock < CRITICAL_THRESHOLD / 2;
        
        if (isCritical) {
          alerts.push({
            id: `blood-critical-${group}`,
            type: 'error',
            title: `Kho máu ${group} dưới mức an toàn`,
            message: `Lượng máu dự trữ hiện tại chỉ còn ${(stock/1000).toFixed(1)}L. Cần bổ sung gấp.`,
            icon: Droplet,
            actions: [
              { label: 'Tạo chiến dịch hiến máu', onClick: () => setShowCampaignModal({ group }) },
              { label: 'Thông báo khẩn', onClick: () => toast.success(`Đã gửi thông báo khẩn cho nhóm máu ${group}`) },
              { label: 'Tạo sự kiện hiến máu khẩn cấp', onClick: () => setShowEmergencyEventModal({ group }) }
            ]
          });
        } else {
          alerts.push({
            id: `blood-shortage-${group}`,
            type: 'warning',
            title: `Thiếu máu ${group} tại ${regionFilter || 'Hà Nội'}`,
            message: `Lượng máu dự trữ hiện tại đang giảm nhanh.`,
            icon: AlertTriangle,
            actions: [
              { label: `Gửi thông báo cho người hiến máu ${group}`, onClick: () => toast.success(`Đã gửi thông báo cho người hiến máu nhóm ${group}`) }
            ]
          });
        }
      }
    });

    // Low registration events
    filteredEvents.filter(e => e.status === 'upcoming').forEach(event => {
      const registeredCount = records.filter(r => r.eventId === event.id).length;
      const ratio = registeredCount / event.target;
      const parsedDate = parseISO(event.startDate);
      if (ratio < 0.3 && isValid(parsedDate) && isAfter(parsedDate, new Date())) {
        alerts.push({
          id: `event-${event.id}`,
          type: 'warning',
          title: `Sự kiện ít người đăng ký: ${event.title}`,
          message: `Mới chỉ có ${Math.round(ratio * 100)}% người đăng ký tham gia.`,
          icon: CalendarDays,
          actions: [
            { label: 'Quản lý sự kiện', onClick: () => navigate('/admin/events') }
          ]
        });
      }
    });

    return alerts;
  }, [records, filteredEvents, regionFilter, navigate]);

  // 3. Top Donors
  const topDonors = useMemo(() => {
    const donorCounts = records
      .filter(r => r.status === 'completed')
      .reduce((acc, record) => {
        acc[record.userId] = (acc[record.userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(donorCounts)
      .map(([userId, count]) => {
        const user = users.find(u => u.id === userId);
        return {
          id: userId,
          name: user?.name || 'Người dùng ẩn danh',
          count,
          badge: count >= 5 ? 'Kim cương' : count >= 3 ? 'Vàng' : 'Bạc',
          badgeColor: count >= 5 ? 'bg-blue-100 text-blue-700' : count >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-700'
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records, users]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents
      .filter(e => e.status === 'upcoming')
      .sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
      })
      .slice(0, 5)
      .map(event => {
        const registeredCount = records.filter(r => r.eventId === event.id).length;
        const percent = Math.min(100, Math.round((registeredCount / event.target) * 100));
        return { ...event, registeredCount, percent };
      });
  }, [events, records]);

  // 4. Charts Data
  const dataByDay = useMemo(() => {
    const registrationsByDate = records.reduce((acc, record) => {
      const parsedDate = parseISO(record.date);
      if (isValid(parsedDate)) {
        const dateStr = format(parsedDate, 'dd/MM');
        acc[dateStr] = (acc[dateStr] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const result = [];
    let totalAmount = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'dd/MM');
      
      const amount = registrationsByDate[dateStr] || 0;
      totalAmount += amount;
        
      result.push({
        name: dateStr,
        amount
      });
    }
    
    if (totalAmount === 0) {
      return result.map(item => ({
        ...item,
        amount: Math.floor(Math.random() * 10) + 1
      }));
    }
    
    return result;
  }, [records]);

  const dataByBloodType = useMemo(() => {
    const bloodGroupCounts = users.reduce((acc, user) => {
      if (user.bloodGroup) {
        acc[user.bloodGroup] = (acc[user.bloodGroup] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#6366f1'];
    const allBloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    
    const totalUsersWithBloodGroup = allBloodGroups.reduce((sum, bg) => sum + (bloodGroupCounts[bg] || 0), 0);
    
    if (totalUsersWithBloodGroup === 0) {
      return allBloodGroups.map((bg, index) => ({
        name: `Nhóm ${bg}`,
        value: [42, 3, 24, 1, 19, 1, 9, 1][index],
        count: 0,
        color: colors[index]
      }));
    }

    return allBloodGroups.map((bg, index) => ({
      name: `Nhóm ${bg}`,
      value: Math.round(((bloodGroupCounts[bg] || 0) / totalUsersWithBloodGroup) * 100),
      count: bloodGroupCounts[bg] || 0,
      color: colors[index]
    }));
  }, [users]);

  const stats = [
    { type: 'events', title: 'Tổng sự kiện', value: events.length.toString(), change: '+12%', isPositive: true, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-100' },
    { type: 'donors', title: 'Người hiến mới', value: users.filter(u => u.role === 'donor').length.toString(), change: '+24%', isPositive: true, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { type: 'checkins', title: 'Đã check-in', value: records.filter(r => r.status === 'checked-in' || r.status === 'completed').length.toString(), change: '+18%', isPositive: true, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { type: 'blood', title: 'Đơn vị máu (ml)', value: `${(records.reduce((acc, curr) => acc + (curr.amount || 0), 0) / 1000).toFixed(1)}L`, change: '-4%', isPositive: false, icon: Droplet, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h1>
          <p className="text-slate-500 text-sm mt-1">Chào mừng Admin, đây là tình hình hoạt động hôm nay.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none appearance-none min-w-[160px]"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="">Tất cả khu vực</option>
              {VIETNAM_PROVINCES.map(p => (
                <option key={`region-filter-${p}`} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-sm text-slate-600">{format(new Date(), "eeee, dd MMMM", { locale: vi })}</span>
          </div>
          <button className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm px-4 py-2.5 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Tải báo cáo
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
          <div 
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-200 transition-all cursor-pointer group"
            onClick={() => setDetailsModal({ title: stat.title, type: stat.type })}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stat.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <div>
              <h3 className="text-slate-500 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
            </div>
          </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* System Alerts Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Cảnh báo hệ thống
              </h3>
              <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                {systemAlerts.length} thông báo
              </span>
            </div>
            <div className="p-4 space-y-3">
              {systemAlerts.length > 0 ? (
                systemAlerts.map(alert => (
                  <div key={alert.id} className={`flex items-start gap-4 p-4 rounded-xl border ${alert.type === 'error' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${alert.type === 'error' ? 'bg-red-100' : 'bg-amber-100'}`}>
                      <alert.icon className={`w-5 h-5 ${alert.type === 'error' ? 'text-red-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm ${alert.type === 'error' ? 'text-red-900' : 'text-amber-900'}`}>{alert.title}</h4>
                      <p className={`text-xs mt-1 ${alert.type === 'error' ? 'text-red-700' : 'text-amber-700'}`}>{alert.message}</p>
                      {alert.actions && alert.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {alert.actions.map((action: any) => (
                            <Button 
                              key={`${alert.id}-${action.label}`} 
                              size="sm" 
                              variant={alert.type === 'error' ? 'default' : 'outline'} 
                              className={alert.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-amber-200 text-amber-700 hover:bg-amber-100'}
                              onClick={action.onClick}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm italic">
                  Hệ thống đang hoạt động ổn định, không có cảnh báo nào.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events Enhanced */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sự kiện sắp diễn ra</h3>
                <p className="text-sm text-slate-500">Theo dõi tiến độ đăng ký của các sự kiện</p>
              </div>
              <Link to="/admin/events" className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
                Quản lý tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="p-6 space-y-6">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-red-100 hover:bg-red-50/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{event.title}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {isValid(parseISO(event.startDate)) ? format(parseISO(event.startDate), 'dd/MM/yyyy') : event.startDate}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </span>
                    </div>
                  </div>
                  <div className="w-full sm:w-48 space-y-2">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-slate-500">Đã đăng ký: {event.registeredCount}/{event.target}</span>
                      <span className={event.percent > 80 ? 'text-emerald-600' : 'text-blue-600'}>{event.percent}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${event.percent > 80 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${event.percent}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full sm:w-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/events`);
                      }}
                    >
                      Quản lý
                    </Button>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="text-center py-8 text-slate-500 italic">Không có sự kiện nào sắp tới</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          
          {/* Top Donors */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-amber-500" />
              Top người hiến máu
            </h3>
            <div className="space-y-4">
              {topDonors.map((donor, i) => (
                <div key={donor.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">
                    {donor.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{donor.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500">{donor.count} lần hiến</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${donor.badgeColor}`}>
                        {donor.badge}
                      </span>
                    </div>
                  </div>
                  {i === 0 && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* Blood Type Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-red-500" />
              Phân loại nhóm máu
            </h3>
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataByBloodType}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataByBloodType.map((entry, index) => (
                      <Cell key={`cell-dashboard-blood-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value}%`, 'Tỷ lệ']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-lg font-bold text-slate-900">100%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {dataByBloodType.map((type, i) => (
                <div key={type.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }}></div>
                  <span className="text-[10px] text-slate-600 truncate">{type.name}</span>
                  <span className="text-[10px] font-bold text-slate-900 ml-auto">{type.value}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Details Modal */}
      {detailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Chi tiết: {detailsModal.title}</h2>
              <button onClick={() => setDetailsModal(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {detailsModal.type === 'donors' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-sm text-slate-500">
                        <th className="pb-3 font-medium">Tên người hiến</th>
                        <th className="pb-3 font-medium">Nhóm máu</th>
                        <th className="pb-3 font-medium">Sự kiện tham gia</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[...users].filter(u => u.role === 'donor').reverse().map(user => {
                        const userRecords = records.filter(r => r.userId === user.id);
                        const participatedEvents = userRecords
                          .map(r => events.find(e => e.id === r.eventId)?.title)
                          .filter(Boolean)
                          .filter((value, index, self) => self.indexOf(value) === index) // Unique
                          .join(', ');
                        return (
                          <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                            <td className="py-3 font-medium text-slate-900">{user.name}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                user.bloodGroup ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {user.bloodGroup || 'Chưa cập nhật'}
                              </span>
                            </td>
                            <td className="py-3 text-slate-600">
                              {participatedEvents ? (
                                <span className="line-clamp-2" title={participatedEvents}>{participatedEvents}</span>
                              ) : (
                                <span className="text-slate-400 italic">Chưa tham gia</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {detailsModal.type === 'events' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-sm text-slate-500">
                        <th className="pb-3 font-medium">Tên sự kiện</th>
                        <th className="pb-3 font-medium">Ngày</th>
                        <th className="pb-3 font-medium">Địa điểm</th>
                        <th className="pb-3 font-medium">Tiến độ</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[...events].reverse().map(event => (
                        <tr key={event.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="py-3 font-medium text-slate-900">{event.title}</td>
                          <td className="py-3 text-slate-600">
                            {isValid(parseISO(event.startDate)) ? format(parseISO(event.startDate), 'dd/MM/yyyy') : event.startDate}
                          </td>
                          <td className="py-3 text-slate-600">{event.location}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{event.registered}/{event.target}</span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500" 
                                  style={{ width: `${Math.min(100, (event.registered / event.target) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailsModal.type === 'checkins' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-sm text-slate-500">
                        <th className="pb-3 font-medium">Người hiến</th>
                        <th className="pb-3 font-medium">Sự kiện</th>
                        <th className="pb-3 font-medium">Thời gian</th>
                        <th className="pb-3 font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {records
                        .filter(r => r.status === 'checked-in' || r.status === 'completed')
                        .reverse()
                        .map(record => {
                          const user = users.find(u => u.id === record.userId);
                          const event = events.find(e => e.id === record.eventId);
                          return (
                            <tr key={`record-list-1-${record.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                              <td className="py-3 font-medium text-slate-900">{user?.name || 'Ẩn danh'}</td>
                              <td className="py-3 text-slate-600">{event?.title || 'Sự kiện đã xóa'}</td>
                              <td className="py-3 text-slate-600">
                                {isValid(parseISO(record.date)) ? format(parseISO(record.date), 'dd/MM/yyyy') : record.date}
                              </td>
                              <td className="py-3">
                                <Badge variant={record.status === 'completed' ? 'success' : 'default'}>
                                  {record.status === 'completed' ? 'Hoàn thành' : 'Đã check-in'}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {detailsModal.type === 'blood' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-sm text-slate-500">
                        <th className="pb-3 font-medium">Người hiến</th>
                        <th className="pb-3 font-medium">Nhóm máu</th>
                        <th className="pb-3 font-medium">Lượng máu</th>
                        <th className="pb-3 font-medium">Ngày hiến</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {records
                        .filter(r => r.status === 'completed')
                        .reverse()
                        .map(record => {
                          const user = users.find(u => u.id === record.userId);
                          return (
                            <tr key={`record-list-2-${record.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                              <td className="py-3 font-medium text-slate-900">{user?.name || 'Ẩn danh'}</td>
                              <td className="py-3">
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100">
                                  {record.bloodGroup}
                                </Badge>
                              </td>
                              <td className="py-3 font-bold text-slate-900">{record.amount} ml</td>
                              <td className="py-3 text-slate-600">
                                {isValid(parseISO(record.date)) ? format(parseISO(record.date), 'dd/MM/yyyy') : record.date}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Emergency Event Modal */}
      {showEmergencyEventModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Tạo sự kiện khẩn cấp</h2>
              <button onClick={() => setShowEmergencyEventModal(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên sự kiện</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={emergencyEventData.title}
                  onChange={e => setEmergencyEventData({...emergencyEventData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={emergencyEventData.location}
                  onChange={e => setEmergencyEventData({...emergencyEventData, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={emergencyEventData.startDate}
                    onChange={e => setEmergencyEventData({...emergencyEventData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={emergencyEventData.time}
                    onChange={e => setEmergencyEventData({...emergencyEventData, time: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng cần</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={emergencyEventData.target}
                    onChange={e => setEmergencyEventData({...emergencyEventData, target: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm máu cần</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={emergencyEventData.bloodGroup}
                    onChange={e => setEmergencyEventData({...emergencyEventData, bloodGroup: e.target.value})}
                  >
                    {BLOOD_GROUPS.map(bg => <option key={`emergency-${bg}`} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEmergencyEventModal(null)}>Hủy</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCreateEmergencyEvent}>Tạo sự kiện ngay</Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Tạo chiến dịch truyền thông</h2>
              <button onClick={() => setShowCampaignModal(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thông điệp kêu gọi</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]"
                  value={campaignData.message}
                  onChange={e => setCampaignData({...campaignData, message: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nhóm máu cần</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={campaignData.bloodGroup}
                    onChange={e => setCampaignData({...campaignData, bloodGroup: e.target.value})}
                  >
                    <option value="">Tất cả</option>
                    {BLOOD_GROUPS.map(bg => <option key={`campaign-${bg}`} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Khu vực</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={campaignData.region}
                    onChange={e => setCampaignData({...campaignData, region: e.target.value})}
                  >
                    {VIETNAM_PROVINCES.map(p => <option key={`campaign-region-${p}`} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    checked={campaignData.sendNotification}
                    onChange={e => setCampaignData({...campaignData, sendNotification: e.target.checked})}
                  />
                  <span className="text-sm text-slate-700">Gửi thông báo tới người dùng</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    checked={campaignData.postToCommunity}
                    onChange={e => setCampaignData({...campaignData, postToCommunity: e.target.checked})}
                  />
                  <span className="text-sm text-slate-700">Đăng lên khu vực cộng đồng</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCampaignModal(null)}>Hủy</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCreateCampaign}>Gửi thông báo ngay</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
