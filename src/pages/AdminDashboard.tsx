import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Users, Calendar, Droplets, Activity, Plus, FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { currentUser, events, records, users } = useApp();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (!currentUser || !['admin', 'staff', 'organizer'].includes(currentUser.role)) return null;

  const activeEvents = events.filter(e => e.status !== 'completed').length;
  const totalDonors = new Set(records.map(r => r.userId)).size;
  const totalBloodCollected = records.filter(r => r.status === 'completed').reduce((acc, r) => acc + r.amount, 0);

  const bloodGroupCounts = users.reduce((acc, user) => {
    if (user && user.points !== undefined && user.bloodGroup) {
      acc[user.bloodGroup] = (acc[user.bloodGroup] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const allBloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const totalUsersWithBloodGroup = allBloodGroups.reduce((sum, bg) => sum + (bloodGroupCounts[bg] || 0), 0);

  const bloodGroupData = totalUsersWithBloodGroup > 0 
    ? allBloodGroups.map(bg => ({
        name: bg,
        value: Math.round(((bloodGroupCounts[bg] || 0) / totalUsersWithBloodGroup) * 100)
      }))
    : [
        { name: 'O+', value: 42 },
        { name: 'O-', value: 3 },
        { name: 'A+', value: 24 },
        { name: 'A-', value: 1 },
        { name: 'B+', value: 19 },
        { name: 'B-', value: 1 },
        { name: 'AB+', value: 9 },
        { name: 'AB-', value: 1 }
      ];

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

  const monthlyData = [
    { name: 'T1', amount: 4000 },
    { name: 'T2', amount: 3000 },
    { name: 'T3', amount: 2000 },
    { name: 'T4', amount: 2780 },
    { name: 'T5', amount: 1890 },
    { name: 'T6', amount: 2390 },
    { name: 'T7', amount: 3490 },
  ];

  // Pagination logic
  const sortedEvents = [...events].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = sortedEvents.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tổng quan hệ thống</h1>
          <p className="text-slate-500 mt-2">Báo cáo tình hình hiến máu và sự kiện.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </Button>
          <Button className="gap-2" asChild>
            <Link to="/admin/events/new"><Plus className="w-4 h-4" /> Tạo sự kiện mới</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Sự kiện đang mở</p>
                <h2 className="text-3xl font-bold text-slate-900">{activeEvents}</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Tổng người hiến</p>
                <h2 className="text-3xl font-bold text-slate-900">{totalDonors + 1240}</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Máu thu nhận (ml)</p>
                <h2 className="text-3xl font-bold text-slate-900">{(totalBloodCollected + 450000).toLocaleString()}</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">Tỷ lệ hoàn thành</p>
                <h2 className="text-3xl font-bold text-slate-900">85%</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Lượng máu thu nhận theo tháng</CardTitle>
            <CardDescription>Đơn vị: ml</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }} 
                    formatter={(value: number) => [`${value.toLocaleString()} ml`, 'Lượng máu']}
                  />
                  <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Phân bổ nhóm máu</CardTitle>
            <CardDescription>Tỷ lệ phần trăm các nhóm máu trong kho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bloodGroupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {bloodGroupData.map((entry, index) => (
                      <Cell key={`cell-admin-dashboard-blood-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value} người`, name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-sm">
                {bloodGroupData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="font-medium text-slate-700">{entry.name}</span>
                    <span className="text-slate-500">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events List */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sự kiện gần đây</CardTitle>
            <CardDescription>Danh sách các sự kiện hiến máu mới nhất</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/events">Xem tất cả</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Tên sự kiện</th>
                  <th className="px-6 py-3 font-medium">Ngày tổ chức</th>
                  <th className="px-6 py-3 font-medium">Địa điểm</th>
                  <th className="px-6 py-3 font-medium">Đăng ký / Mục tiêu</th>
                  <th className="px-6 py-3 font-medium">Trạng thái</th>
                  <th className="px-6 py-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map((event) => (
                  <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{event.title}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {event.startDate === event.endDate 
                        ? format(parseISO(event.startDate), 'dd/MM/yyyy')
                        : `${format(parseISO(event.startDate), 'dd/MM/yyyy')} - ${format(parseISO(event.endDate), 'dd/MM/yyyy')}`
                      }
                    </td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]">{event.location}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{event.registered}</span>
                        <span className="text-slate-400">/ {event.target}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-2">
                          <div 
                            className={`h-full ${event.registered >= event.target ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min(100, (event.registered / event.target) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={event.status === 'upcoming' ? 'default' : event.status === 'ongoing' ? 'warning' : 'secondary'}>
                        {event.status === 'upcoming' ? 'Sắp tới' : event.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => navigate(`/events/${event.id}`)}
                      >
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-2 gap-4">
              <div className="text-sm text-slate-500 text-center sm:text-left">
                Hiển thị <span className="font-medium text-slate-900">{startIndex + 1}</span> đến <span className="font-medium text-slate-900">{Math.min(startIndex + itemsPerPage, events.length)}</span> trong số <span className="font-medium text-slate-900">{events.length}</span> sự kiện
              </div>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-8 h-8 p-0" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${currentPage === page ? '' : 'text-slate-600'}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-8 h-8 p-0" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
