import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Trophy, Medal, Droplets, Search, Filter, ArrowLeft, Star, Flame, CalendarDays } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';

export const Leaderboard: React.FC = () => {
  const { users, records } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodFilter, setBloodFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'donations' | 'minigame' | 'monthly'>('donations');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Calculate monthly active users
  const monthlyActiveUsers = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyRecords = records.filter(r => {
      if (r.status !== 'completed') return false;
      const recordDate = new Date(r.date);
      if (isNaN(recordDate.getTime())) return false;
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const userDonationCounts: Record<string, number> = {};
    monthlyRecords.forEach(r => {
      userDonationCounts[r.userId] = (userDonationCounts[r.userId] || 0) + 1;
    });

    return userDonationCounts;
  }, [records]);

  const donors = useMemo(() => {
    let filtered = users
      .filter(u => u.role === 'donor')
      .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(u => bloodFilter === 'all' || u.bloodGroup === bloodFilter);

    if (activeTab === 'donations') {
      filtered.sort((a, b) => b.donationsCount - a.donationsCount);
    } else if (activeTab === 'minigame') {
      filtered.sort((a, b) => (b.points || 0) - (a.points || 0));
    } else if (activeTab === 'monthly') {
      filtered = filtered.filter(u => monthlyActiveUsers[u.id] > 0);
      filtered.sort((a, b) => {
        const countA = monthlyActiveUsers[a.id] || 0;
        const countB = monthlyActiveUsers[b.id] || 0;
        if (countB !== countA) return countB - countA;
        return (b.points || 0) - (a.points || 0); // tie-breaker
      });
    }

    return filtered;
  }, [users, searchTerm, bloodFilter, activeTab, monthlyActiveUsers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Bảng xếp hạng cộng đồng
          </h1>
          <p className="text-slate-500 mt-1">Vinh danh những "người hùng" thầm lặng trong phong trào hiến máu tình nguyện.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="donations" className="rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-600 py-2.5 px-4 flex-1 min-w-[150px]">
            <Droplets className="w-4 h-4 mr-2" />
            Top người hiến máu
          </TabsTrigger>
          <TabsTrigger value="minigame" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 py-2.5 px-4 flex-1 min-w-[150px]">
            <Star className="w-4 h-4 mr-2" />
            Top điểm Mini Game
          </TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 py-2.5 px-4 flex-1 min-w-[150px]">
            <Flame className="w-4 h-4 mr-2" />
            Tích cực tháng này
          </TabsTrigger>
        </TabsList>

        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tên người hiến máu..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <Button 
                    variant={bloodFilter === 'all' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setBloodFilter('all')}
                    className="rounded-full px-4"
                  >
                    Tất cả
                  </Button>
                  {bloodGroups.map(group => (
                    <Button 
                      key={group}
                      variant={bloodFilter === group ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setBloodFilter(group)}
                      className="rounded-full px-4"
                    >
                      {group}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20 text-center">Hạng</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người hiến máu</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Nhóm máu</th>
                    {activeTab === 'monthly' && (
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Trong tháng</th>
                    )}
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tổng lần hiến</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Điểm tích lũy</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Danh hiệu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donors.length > 0 ? (
                    donors.map((donor, index) => (
                      <tr key={donor.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                            index === 0 ? 'bg-amber-100 text-amber-700' : 
                            index === 1 ? 'bg-slate-100 text-slate-700' : 
                            index === 2 ? 'bg-orange-100 text-orange-700' : 
                            'text-slate-500'
                          }`}>
                            {index < 3 ? (
                              <Medal className={`w-5 h-5 ${
                                index === 0 ? 'text-amber-500' : 
                                index === 1 ? 'text-slate-400' : 
                                'text-orange-400'
                              }`} />
                            ) : (
                              index + 1
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={donor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${donor.name}`} 
                              alt={donor.name} 
                              className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">{donor.name}</p>
                              <p className="text-xs text-slate-500">{donor.address || 'Thành viên Máu+'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="outline" className="font-bold border-red-100 text-red-600 bg-red-50/30">
                            {donor.bloodGroup || '??'}
                          </Badge>
                        </td>
                        {activeTab === 'monthly' && (
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-lg font-black text-orange-600 leading-none">+{monthlyActiveUsers[donor.id] || 0}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Lần</span>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-lg font-black text-slate-900 leading-none">{donor.donationsCount}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Lần</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold text-amber-600">{(donor.points || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {donor.donationsCount >= 10 ? (
                            <Badge className="bg-amber-500 text-white border-none">Hiệp sĩ Vàng</Badge>
                          ) : donor.donationsCount >= 5 ? (
                            <Badge className="bg-slate-400 text-white border-none">Chiến binh Bạc</Badge>
                          ) : donor.donationsCount >= 3 ? (
                            <Badge className="bg-orange-400 text-white border-none">Thành viên Đồng</Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-400 border-slate-200">Thành viên mới</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={activeTab === 'monthly' ? 7 : 6} className="px-6 py-12 text-center text-slate-500">
                        Không tìm thấy người hiến máu nào phù hợp với tiêu chí.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

