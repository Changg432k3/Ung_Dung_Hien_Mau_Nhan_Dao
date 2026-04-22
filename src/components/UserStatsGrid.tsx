import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Droplets, Heart, Award, ArrowRight } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { format, parseISO } from 'date-fns';

export const UserStatsGrid: React.FC = () => {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-none shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm font-medium mb-1">Nhóm máu của bạn</p>
            <h2 className="text-4xl font-bold">{currentUser.bloodGroup || 'Chưa rõ'}</h2>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <Droplets className="w-8 h-8 text-white" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Số lần hiến máu</p>
            <h2 className="text-4xl font-bold text-slate-900">{currentUser.donationsCount}</h2>
            <p className="text-xs text-slate-400 mt-2">Lần gần nhất: {currentUser.lastDonationDate ? format(parseISO(currentUser.lastDonationDate), 'dd/MM/yyyy') : 'Chưa có'}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <Heart className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" onClick={() => window.location.href = '/rewards'}>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1 group-hover:text-amber-600 transition-colors">Điểm tích lũy</p>
            <h2 className="text-4xl font-bold text-slate-900">{currentUser?.points || 0}</h2>
            <p className="text-xs text-slate-400 mt-2">Đổi quà ngay <ArrowRight className="w-3 h-3 inline-block ml-1" /></p>
          </div>
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
            <Award className="w-8 h-8 text-amber-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
