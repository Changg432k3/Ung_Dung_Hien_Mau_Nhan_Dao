import React from 'react';
import { useApp } from '../store/AppContext';
import MiniQuizWidget from './MiniQuizWidget';
import LuckyWheel from './LuckyWheel';
import { Trophy, Gift, Star, ArrowRight, TrendingUp, Award, Medal, Flame, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const MiniGameTab: React.FC = () => {
  const { users, currentUser, badges } = useApp();

  // Sort users by points for the mini leaderboard
  const topUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5);

  // Get user's badges
  const isBadgeEarned = (badge: any) => {
    if (!currentUser) return false;
    if (badge.id === 'b_quiz') {
      return (currentUser.completedChallenges || []).includes('quiz_master');
    }
    if (badge.id === 'b_knowledge') return (currentUser.correctAnswersCount || 0) >= 10;
    if (badge.id === 'b_expert') return (currentUser.correctAnswersCount || 0) >= 50;
    if (badge.id === 'b_intellect') return (currentUser.maxConsecutiveCorrect || 0) >= 10;
    
    return currentUser.donationsCount >= badge.condition;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Quiz Section */}
      <div className="lg:col-span-2 space-y-6">
        {/* User Game Stats Bar */}
        {/* User Game Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Chuỗi ngày</p>
              <p className="text-xl font-black text-slate-900">{currentUser?.dailyStreak || 0} ngày</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Cấp độ</p>
              <p className="text-xl font-black text-slate-900">Lv. {currentUser?.gameLevel || 1}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Đúng liên tiếp</p>
              <p className="text-xl font-black text-slate-900">{currentUser?.consecutiveCorrect || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Thử thách kiến thức</h2>
              <p className="text-sm text-slate-500">Trả lời đúng các câu hỏi trong thời gian giới hạn để tích lũy điểm thưởng.</p>
            </div>
          </div>
          
          <MiniQuizWidget />
        </div>

        {/* Lucky Wheel */}
        <LuckyWheel />

        {/* Badges Section */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Huy hiệu của bạn</h2>
                <p className="text-xs text-slate-500">Những thành tích bạn đã đạt được qua các thử thách.</p>
              </div>
            </div>
            <Link to="/profile" className="text-xs text-indigo-600 hover:underline font-medium">Xem tất cả</Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {badges.filter(b => b.id.startsWith('b_')).slice(0, 4).map((badge) => {
              const earned = isBadgeEarned(badge);
              return (
                <div 
                  key={badge.id} 
                  className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                    earned 
                      ? 'bg-amber-50 border-amber-100 shadow-sm' 
                      : 'bg-slate-50 border-slate-100 opacity-50 grayscale'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    earned ? 'bg-white shadow-md' : 'bg-slate-200'
                  }`}>
                    <Medal className={`w-6 h-6 ${earned ? 'text-amber-500' : 'text-slate-400'}`} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 mb-1">{badge.name}</h3>
                  <p className="text-[10px] text-slate-500 leading-tight">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Rewards Info */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg shadow-red-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl font-bold">Dùng điểm đổi quà tặng</h3>
              <p className="text-red-50 opacity-90 text-sm max-w-md">
                Tích lũy điểm từ các hoạt động hiến máu và trò chơi để đổi lấy những phần quà hấp dẫn từ Máu+.
              </p>
            </div>
            <Button 
              asChild
              className="bg-white text-red-600 hover:bg-red-50 border-none px-8 h-12 rounded-xl font-bold shrink-0"
            >
              <Link to="/rewards">
                Đổi quà ngay <Gift className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Leaderboard */}
      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-900">Bảng xếp hạng</h2>
            </div>
            <Link to="/leaderboard" className="text-xs text-indigo-600 hover:underline font-medium">Xem tất cả</Link>
          </div>
          <div className="p-5 space-y-4">
            {topUsers.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' : 
                      index === 1 ? 'bg-slate-100 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <img 
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full border border-slate-100"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[100px]">{user.name}</p>
                      <p className="text-[10px] text-slate-500">{user.donationsCount} lần hiến</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-indigo-600 font-bold text-sm">
                    <Star className="w-3 h-3 fill-current" />
                    {user.points || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* User Stats Card */}
                <section className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
          {/* Hiệu ứng trang trí nền */}
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Trophy className="w-8 h-8 text-white fill-amber-400" />
              </div>
              <div>
                <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider opacity-80">Điểm tích lũy</p>
                <p className="text-3xl font-black tracking-tight">{currentUser?.points || 0}</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/10">
              <p className="text-xs text-indigo-50 leading-relaxed font-medium">
                {((topUsers[0]?.points || 0) - (currentUser?.points || 0)) > 0 
                  ? `Bạn cần thêm ${(topUsers[0]?.points || 0) - (currentUser?.points || 0)} điểm để vươn lên vị trí dẫn đầu.`
                  : "Bạn đang dẫn đầu bảng xếp hạng! Hãy duy trì phong độ nhé."}
              </p>
            </div>

            <Button 
              variant="ghost" 
              className="w-full bg-white text-indigo-600 hover:bg-indigo-50 h-12 rounded-xl font-bold shadow-lg"
              asChild
            >
              <Link to="/leaderboard">
                Xem chi tiết xếp hạng <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MiniGameTab;
