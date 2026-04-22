import React, { useState, useMemo } from 'react';
import { useApp, User } from '../../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Trophy, Medal, Droplets, Star, CalendarDays, Award, Mail, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { toast } from 'sonner';

export const AdminLeaderboard: React.FC = () => {
  const { users, records } = useApp();
  const [activeTab, setActiveTab] = useState<'donations' | 'community' | 'events'>('donations');

  // Calculate event participation
  const eventParticipation = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => {
      if (r.status === 'completed') {
        counts[r.userId] = (counts[r.userId] || 0) + 1;
      }
    });
    return counts;
  }, [records]);

  const donors = useMemo(() => {
    let filtered = users.filter(u => u.role === 'donor');

    if (activeTab === 'donations') {
      filtered.sort((a, b) => b.donationsCount - a.donationsCount);
    } else if (activeTab === 'community') {
      filtered.sort((a, b) => (b.points || 0) - (a.points || 0));
    } else if (activeTab === 'events') {
      filtered.sort((a, b) => {
        const countA = eventParticipation[a.id] || 0;
        const countB = eventParticipation[b.id] || 0;
        if (countB !== countA) return countB - countA;
        return (b.points || 0) - (a.points || 0); // tie-breaker
      });
    }

    return filtered.slice(0, 50); // Top 50
  }, [users, activeTab, eventParticipation]);

  const handleHonor = (user: User) => {
    toast.success(`Đã gửi thông báo tôn vinh đến ${user.name}!`);
  };

  const handleInvite = (user: User) => {
    toast.success(`Đã gửi lời mời tham gia sự kiện sắp tới cho ${user.name}!`);
  };

  const handleAwardBadge = (user: User) => {
    toast.success(`Đã trao huy hiệu đặc biệt cho ${user.name}!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          Thống kê & Xếp hạng
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Theo dõi những người hiến máu tích cực nhất để tôn vinh, mời tham gia sự kiện và trao huy hiệu.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="donations" className="rounded-lg data-[state=active]:bg-red-50 data-[state=active]:text-red-600 py-2.5 px-4 flex-1 min-w-[150px]">
            <Droplets className="w-4 h-4 mr-2" />
            Top hiến máu nhiều nhất
          </TabsTrigger>
          <TabsTrigger value="community" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 py-2.5 px-4 flex-1 min-w-[150px]">
            <Star className="w-4 h-4 mr-2" />
            Top tích cực cộng đồng
          </TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 py-2.5 px-4 flex-1 min-w-[150px]">
            <CalendarDays className="w-4 h-4 mr-2" />
            Top tham gia sự kiện
          </TabsTrigger>
        </TabsList>

        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20 text-center">Hạng</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người dùng</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                    {activeTab === 'donations' ? 'Số lần hiến' : activeTab === 'community' ? 'Điểm tích lũy' : 'Sự kiện tham gia'}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hành động quản lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donors.length > 0 ? (
                  donors.map((donor, index) => (
                    <tr key={donor.id} className="hover:bg-slate-50/50 transition-colors group bg-white">
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
                            <p className="font-bold text-slate-900">{donor.name}</p>
                            <p className="text-xs text-slate-500">{donor.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {activeTab === 'donations' && (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-lg font-black text-red-600 leading-none">{donor.donationsCount}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Lần</span>
                          </div>
                        )}
                        {activeTab === 'community' && (
                          <span className="font-semibold text-indigo-600 text-lg">{(donor.points || 0).toLocaleString()} pts</span>
                        )}
                        {activeTab === 'events' && (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-lg font-black text-emerald-600 leading-none">{eventParticipation[donor.id] || 0}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold mt-1">Sự kiện</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-amber-600 border-amber-200 hover:bg-amber-50 w-full sm:w-auto justify-start sm:justify-center"
                            onClick={() => handleHonor(donor)}
                          >
                            <Star className="w-4 h-4 mr-1.5" />
                            Tôn vinh
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 w-full sm:w-auto justify-start sm:justify-center"
                            onClick={() => handleInvite(donor)}
                          >
                            <Mail className="w-4 h-4 mr-1.5" />
                            Mời sự kiện
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-purple-600 border-purple-200 hover:bg-purple-50 w-full sm:w-auto justify-start sm:justify-center"
                            onClick={() => handleAwardBadge(donor)}
                          >
                            <Award className="w-4 h-4 mr-1.5" />
                            Trao huy hiệu
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Tabs>
    </div>
  );
};
