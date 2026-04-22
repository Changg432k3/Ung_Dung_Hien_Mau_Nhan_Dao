import React, { useMemo, useState } from 'react';
import { 
  Droplets, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  Search,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useApp, BloodGroup } from '../../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Thresholds in ml
const CRITICAL_THRESHOLD = 2000;
const LOW_THRESHOLD = 5000;

export const AdminInventory: React.FC = () => {
  const { records, users, addNotification, addEmergencyCall } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const inventoryData = useMemo(() => {
    // Calculate total collected per blood group
    const collected = records
      .filter(r => r.status === 'completed')
      .reduce((acc, record) => {
        acc[record.bloodGroup] = (acc[record.bloodGroup] || 0) + record.amount;
        return acc;
      }, {} as Record<string, number>);

    // Mock some usage to make it look like real inventory
    // In a real app, this would come from a 'usage' or 'distribution' table
    const usage = {
      'A+': 1200, 'A-': 400, 'B+': 800, 'B-': 300,
      'AB+': 200, 'AB-': 100, 'O+': 1500, 'O-': 600
    } as Record<string, number>;

    return BLOOD_GROUPS.map(group => {
      const totalCollected = collected[group] || 0;
      const totalUsed = usage[group] || 0;
      const currentStock = Math.max(0, totalCollected - totalUsed);
      
      let status: 'Critical' | 'Low' | 'Stable' | 'High' = 'Stable';
      if (currentStock < CRITICAL_THRESHOLD) status = 'Critical';
      else if (currentStock < LOW_THRESHOLD) status = 'Low';
      else if (currentStock > 15000) status = 'High';

      return {
        group,
        stock: currentStock,
        status,
        lastUpdated: new Date().toISOString(), // Mock last update
        trend: Math.random() > 0.5 ? 'up' : 'down', // Mock trend
        donorCount: users.filter(u => u.bloodGroup === group).length
      };
    });
  }, [records, users]);

  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = item.group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportReport = () => {
    const headers = ['Nhóm máu', 'Trữ lượng (ml)', 'Trạng thái', 'Xu hướng', 'Số người hiến'];
    const csvContent = [
      headers.join(','),
      ...inventoryData.map(item => [
        item.group,
        item.stock,
        item.status,
        item.trend === 'up' ? 'Tăng' : 'Giảm',
        item.donorCount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bao_cao_ton_kho_mau_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất báo cáo tồn kho thành công!');
  };

  const handleEmergencyCall = (group: BloodGroup) => {
    const targetUsers = users.filter(u => u.bloodGroup === group);
    
    // 1. Add to community emergency calls
    addEmergencyCall({
      bloodGroup: group,
      location: 'Bệnh viện Trung ương',
      hospitalName: 'Bệnh viện Trung ương',
      message: `Hiện tại kho máu đang thiếu hụt trầm trọng nhóm máu ${group}. Rất mong các tình nguyện viên có thể hỗ trợ.`
    });

    // 2. Send direct notifications
    if (targetUsers.length > 0) {
      targetUsers.forEach(user => {
        addNotification({
          userId: user.id,
          title: `KÊU GỌI KHẨN CẤP: Nhóm máu ${group}`,
          message: `Hiện tại kho máu đang thiếu hụt trầm trọng nhóm máu ${group}. Rất mong bạn có thể sắp xếp thời gian đến hiến máu tại trung tâm gần nhất.`,
          type: 'emergency',
          bloodGroup: group
        });
      });
      toast.success(`Đã gửi thông báo khẩn cấp đến ${targetUsers.length} người hiến nhóm máu ${group} và đăng lên cộng đồng.`);
    } else {
      toast.success(`Đã đăng kêu gọi khẩn cấp nhóm máu ${group} lên cộng đồng.`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Critical':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Nguy cấp</Badge>;
      case 'Low':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Thấp</Badge>;
      case 'Stable':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Ổn định</Badge>;
      case 'High':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Dồi dào</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tồn kho máu nâng cao</h1>
          <p className="text-slate-500 mt-2">Theo dõi và quản lý trữ lượng máu theo thời gian thực.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExportReport}>
            <TrendingUp className="w-4 h-4" /> Báo cáo chi tiết
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-red-100 bg-red-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Nhóm máu thiếu hụt</p>
                <h3 className="text-2xl font-bold text-red-900 mt-1">
                  {inventoryData.filter(i => i.status === 'Critical' || i.status === 'Low').length} Nhóm
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-red-700">
              <span className="font-bold">Cần kêu gọi:</span>
              <span>{inventoryData.filter(i => i.status === 'Critical').map(i => i.group).join(', ') || 'Không có'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Tổng trữ lượng</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {(inventoryData.reduce((acc, i) => acc + i.stock, 0) / 1000).toFixed(1)} Lít
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span>+12% so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Người hiến sẵn sàng</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {users.filter(u => u.role === 'donor' && !u.isLocked).length} Người
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-slate-500">
              <Info className="w-4 h-4" />
              <span>Dựa trên dữ liệu người dùng</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold">Chi tiết tồn kho theo nhóm máu</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm nhóm máu..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-red-500 outline-none transition-all w-full sm:w-64"
                />
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-red-500 outline-none transition-all appearance-none cursor-pointer w-full"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="Critical">Nguy cấp</option>
                  <option value="Low">Thấp</option>
                  <option value="Stable">Ổn định</option>
                  <option value="High">Dồi dào</option>
                </select>
                <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nhóm máu</th>
                  <th className="px-6 py-4 font-semibold">Trữ lượng (ml)</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold">Xu hướng</th>
                  <th className="px-6 py-4 font-semibold">Người hiến</th>
                  <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item, index) => (
                  <motion.tr
                    key={item.group}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                          <span className="text-red-700 font-bold">{item.group}</span>
                        </div>
                        <span className="font-medium text-slate-900">Nhóm {item.group}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold">{item.stock.toLocaleString()} ml</span>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              item.status === 'Critical' ? 'bg-red-500' : 
                              item.status === 'Low' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, (item.stock / 15000) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 ${item.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {item.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="text-xs font-medium">{item.trend === 'up' ? 'Tăng' : 'Giảm'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{item.donorCount} người</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'Critical' || item.status === 'Low' ? (
                        <Button 
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700 text-white gap-2"
                          onClick={() => handleEmergencyCall(item.group)}
                        >
                          <Bell className="w-3.5 h-3.5" /> Kêu gọi khẩn cấp
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-slate-400 cursor-not-allowed">
                          Ổn định
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Management Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-100 bg-blue-50/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
              <Info className="w-5 h-5" /> Gợi ý quản lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-blue-700">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                <span>Nhóm máu O- đang ở mức thấp, nên ưu tiên kêu gọi vì đây là nhóm máu hiến phổ quát.</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                <span>Dự kiến nhu cầu máu sẽ tăng 20% trong tuần lễ hội sắp tới.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
              <TrendingUp className="w-5 h-5" /> Dự báo trữ lượng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700">Khả năng đáp ứng (7 ngày tới)</span>
                <span className="font-bold text-emerald-800">Tốt (85%)</span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-emerald-600 italic">
                * Dựa trên lịch trình các sự kiện hiến máu đã đăng ký.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
