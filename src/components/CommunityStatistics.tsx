import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Users, Droplets, HeartHandshake } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const CommunityStatistics: React.FC = () => {
  const { users, records } = useApp();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Thống kê cộng đồng</h2>
        <Badge variant="outline" className="text-slate-500 font-normal border-slate-200">Cập nhật thời gian thực</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200/60 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Người tham gia</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {users.filter(u => u.role === 'donor').length.toLocaleString()}
                </h3>
                <span className="text-xs text-emerald-600 font-medium">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Droplets className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Lượng máu đã hiến</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {(records.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0) / 1000).toFixed(1)}
                </h3>
                <span className="text-sm font-medium text-slate-600">Lít</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/60 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Người được giúp đỡ</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold text-slate-900">
                  {Math.floor((records.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0) / 250) * 3).toLocaleString()}
                </h3>
                <span className="text-xs text-emerald-600 font-medium">+5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
