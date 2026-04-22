import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Trophy, Medal, Filter, Search, UserPlus, Gift, MessageSquare, Droplets } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

// Mock data
const mockDonors = [
  { id: '1', name: 'Nguyễn Văn A', avatar: 'https://picsum.photos/seed/1/40/40', donations: 12, volume: 4200, points: 1500, badges: ['Vàng'], rank: 1, location: 'Hà Nội', bloodGroup: 'O+', age: 28 },
  { id: '2', name: 'Trần Thị B', avatar: 'https://picsum.photos/seed/2/40/40', donations: 10, volume: 3500, points: 1200, badges: ['Bạc'], rank: 2, location: 'TP.HCM', bloodGroup: 'A+', age: 32 },
  { id: '3', name: 'Lê Văn C', avatar: 'https://picsum.photos/seed/3/40/40', donations: 9, volume: 3150, points: 1100, badges: ['Đồng'], rank: 3, location: 'Đà Nẵng', bloodGroup: 'B+', age: 25 },
  { id: '4', name: 'Phạm Văn D', avatar: 'https://picsum.photos/seed/4/40/40', donations: 8, volume: 2800, points: 900, badges: [], rank: 4, location: 'Hà Nội', bloodGroup: 'AB+', age: 40 },
];

const monthlyData = [
  { name: 'Jan', donations: 400 }, { name: 'Feb', donations: 300 }, { name: 'Mar', donations: 600 },
];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#10b981', '#3b82f6', '#ec4899', '#64748b'];

export const AdminRankingPage: React.FC = () => {
  const { users } = useApp();
  const [hoveredDonor, setHoveredDonor] = useState<any>(null);

  const bloodGroupCounts = users.reduce((acc, user) => {
    if (user.bloodGroup) {
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

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Thống kê & Xếp hạng</h1>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top 10 người hiến theo tháng</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="donations" fill="#ef4444" /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Phân bố nhóm máu</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bloodGroupData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {bloodGroupData.map((entry, index) => <Cell key={`cell-ranking-blood-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Tăng trưởng người hiến</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="donations" stroke="#ef4444" strokeWidth={2} /></LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Ranking Table */}
      <Card className="relative">
        <CardHeader><CardTitle>Bảng xếp hạng chi tiết</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 border-b">
              <tr><th className="p-3">Rank</th><th className="p-3">Người hiến</th><th className="p-3">Số lần</th><th className="p-3">ML</th><th className="p-3">Điểm</th><th className="p-3">Huy hiệu</th><th className="p-3">Hành động</th></tr>
            </thead>
            <tbody>
              {mockDonors.map((donor) => (
                <tr 
                  key={donor.id} 
                  className="border-b hover:bg-slate-50 cursor-pointer"
                  onMouseEnter={() => setHoveredDonor(donor)}
                  onMouseLeave={() => setHoveredDonor(null)}
                  onClick={() => alert(`Xem lịch sử hiến máu của ${donor.name}`)}
                >
                  <td className="p-3 font-bold">#{donor.rank}</td>
                  <td className="p-3 flex items-center gap-2">
                    <img src={donor.avatar} alt={donor.name} className="w-8 h-8 rounded-full" />
                    {donor.name}
                  </td>
                  <td className="p-3">{donor.donations}</td>
                  <td className="p-3">{donor.volume}ml</td>
                  <td className="p-3">{donor.points}</td>
                  <td className="p-3">
                    {donor.badges.map((b, index) => <Badge key={`badge-${donor.id}-${b}-${index}`} variant="secondary" className="bg-amber-100 text-amber-800">{b}</Badge>)}
                  </td>
                  <td className="p-3 flex gap-2">
                    <Button size="sm" variant="ghost"><UserPlus className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost"><Gift className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost"><MessageSquare className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
        {/* Quick Profile View Tooltip */}
        {hoveredDonor && (
          <div className="absolute bg-white p-4 border rounded-lg shadow-xl z-50" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <h3 className="font-bold">{hoveredDonor.name}</h3>
            <p className="text-sm text-slate-500">Nhóm máu: {hoveredDonor.bloodGroup}</p>
            <p className="text-sm text-slate-500">Tuổi: {hoveredDonor.age}</p>
            <p className="text-sm text-slate-500">Khu vực: {hoveredDonor.location}</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminRankingPage;
