import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Gift, Award, Ticket, Search, CheckCircle2, Copy, Clock } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

export const Rewards: React.FC = () => {
  const { currentUser, rewards, redeemedRewards, redeemReward, records } = useApp();
  const [activeTab, setActiveTab] = useState<'available' | 'redeemed' | 'event-gifts'>('available');
  const [redeemedRewardData, setRedeemedRewardData] = useState<{ reward: any, voucherCode?: string } | null>(null);
  const [confirmingReward, setConfirmingReward] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');

  if (!currentUser) return null;

  const myRedeemedRewards = redeemedRewards.filter(rr => rr.userId === currentUser.id);
  const myEventGifts = records.filter(r => r.userId === currentUser.id && r.giftReceived);

  const handleRedeem = (rewardId: string) => {
    setConfirmingReward(rewardId);
  };

  const executeRedeem = () => {
    if (!confirmingReward) return;
    
    const result = redeemReward(confirmingReward);
    if (result.success) {
      triggerConfetti();
      const reward = rewards.find(r => r.id === confirmingReward);
      if (reward) {
        setRedeemedRewardData({ reward, voucherCode: result.voucherCode });
      }
    } else {
      toast.error(result.message || 'Có lỗi xảy ra');
    }
    setConfirmingReward(null);
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép mã vào khay nhớ tạm');
  };

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {confirmingReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận đổi quà</h3>
              <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn sử dụng điểm để đổi phần thưởng này không?</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmingReward(null)}>Hủy</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={executeRedeem}>Đồng ý</Button>
              </div>
            </motion.div>
          </div>
        )}

        {redeemedRewardData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, delay: 0.2 }}
                className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"
              >
                <Gift className="w-12 h-12 text-amber-600" />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-3xl font-black text-slate-900 mb-2">Chúc mừng!</h2>
                <p className="text-slate-600 mb-6 text-lg">Bạn đã đổi thành công <br/><strong className="text-slate-900">{redeemedRewardData.reward.name}</strong></p>
                
                {redeemedRewardData.voucherCode && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
                    <p className="text-sm text-slate-500 mb-2 font-medium uppercase tracking-wider">Mã voucher của bạn</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-3xl font-mono font-bold text-slate-900 tracking-wider">{redeemedRewardData.voucherCode}</span>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-200" onClick={() => copyToClipboard(redeemedRewardData.voucherCode!)}>
                        <Copy className="w-5 h-5 text-slate-600" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-6 text-lg font-bold shadow-lg shadow-red-600/20"
                  onClick={() => {
                    setRedeemedRewardData(null);
                    setActiveTab('redeemed');
                  }}
                >
                  Tuyệt vời!
                </Button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quà tặng & Điểm thưởng</h1>
          <p className="text-slate-500 mt-2">Đổi điểm tích lũy lấy những phần quà hấp dẫn.</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 10 
          }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 shrink-0 shadow-sm"
        >
          <motion.div 
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0"
          >
            <Award className="w-6 h-6 text-amber-600" />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-amber-700">Điểm hiện tại</p>
            <p className="text-2xl font-black text-amber-600">
              <motion.span
                key={currentUser?.points}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block"
              >
                {currentUser?.points || 0}
              </motion.span>
              <span className="text-sm font-medium ml-1">điểm</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'available' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          onClick={() => setActiveTab('available')}
        >
          Đổi quà
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'redeemed' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          onClick={() => setActiveTab('redeemed')}
        >
          Quà tặng đã đổi
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'event-gifts' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          onClick={() => setActiveTab('event-gifts')}
        >
          Lịch sử nhận quà
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'available' && (
          <motion.div
            key="available"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {rewards.map((reward, index) => {
              const canAfford = (currentUser?.points || 0) >= reward.pointsCost;
              const isConditional = reward.conditionType !== 'none';
              
              let conditionMet = true;
              if (reward.conditionType === 'donations') {
                conditionMet = (currentUser?.donationsCount || 0) >= Number(reward.conditionValue);
              } else if (reward.conditionType === 'points') {
                conditionMet = (currentUser?.points || 0) >= Number(reward.conditionValue);
              } else if (reward.conditionType === 'event') {
                // Check if user has joined the specific event
                const joinedEvents = records.filter(r => r.userId === currentUser?.id).map(r => r.eventId);
                conditionMet = joinedEvents.includes(String(reward.conditionValue));
              }

              let buttonText = 'Đổi ngay';
              let buttonDisabled = !canAfford;

              if (isConditional) {
                buttonText = conditionMet ? 'Nhận ngay' : 'Chưa đủ điều kiện';
                buttonDisabled = !conditionMet;
              } else {
                buttonText = canAfford ? 'Đổi ngay' : 'Không đủ điểm';
                buttonDisabled = !canAfford;
              }

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="h-full"
                >
                <Card className="overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 border-slate-200/60">
                  <div className="h-48 bg-slate-100 relative overflow-hidden group">
                    <motion.img 
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      src={reward.imageUrl || undefined} 
                      alt={reward.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-slate-900 border-none shadow-sm backdrop-blur-sm flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        {reward.pointsCost > 0 ? `${reward.pointsCost} điểm` : 'Miễn phí'}
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge variant="outline" className="bg-white/90 border-none shadow-sm backdrop-blur-sm">
                        {reward.type === 'voucher' ? <Ticket className="w-3 h-3 mr-1" /> : <Gift className="w-3 h-3 mr-1" />}
                        {reward.type === 'voucher' ? 'Voucher' : 'Quà tặng'}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{reward.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-slate-600 line-clamp-3">{reward.description}</p>
                    {isConditional && (
                      <p className="text-xs text-red-500 mt-2 font-medium">
                        Điều kiện: {reward.conditionType === 'donations' ? `Đã hiến máu ${reward.conditionValue} lần` : `Đạt ${reward.conditionValue} điểm`}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 border-t border-slate-100 p-4 bg-slate-50">
                    <Button 
                      className={`w-full ${!buttonDisabled ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200'}`}
                      onClick={() => handleRedeem(reward.id)}
                      disabled={buttonDisabled}
                    >
                      {buttonText}
                    </Button>
                  </CardFooter>
                </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'redeemed' && (
          <motion.div
            key="redeemed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {myRedeemedRewards.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm quà tặng đã đổi..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                />
              </div>
            )}

            {myRedeemedRewards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRedeemedRewards
                  .filter(rr => {
                    const reward = rewards.find(r => r.id === rr.rewardId);
                    return reward?.name.toLowerCase().includes(historySearch.toLowerCase());
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    if (isNaN(dateA) && isNaN(dateB)) return 0;
                    if (isNaN(dateA)) return 1;
                    if (isNaN(dateB)) return -1;
                    return dateB - dateA;
                  })
                  .map((rr, index) => {
                    const reward = rewards.find(r => r.id === rr.rewardId);
                    if (!reward) return null;
                    
                    const isExpired = reward.expirationDate && isAfter(new Date(), parseISO(reward.expirationDate));
                    const status = rr.isUsed ? 'Đã dùng' : (isExpired ? 'Hết hạn' : 'Còn hạn');
                    const statusColor = rr.isUsed ? 'bg-slate-100 text-slate-600' : (isExpired ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600');

                    return (
                      <motion.div
                        key={rr.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`overflow-hidden flex flex-col sm:flex-row shadow-sm border-l-4 hover:shadow-md transition-all ${rr.isUsed ? 'border-l-slate-400' : (isExpired ? 'border-l-red-500' : 'border-l-emerald-500')}`}>
                          <div className="w-full sm:w-32 h-32 sm:h-auto bg-slate-100 shrink-0 overflow-hidden">
                            <motion.img 
                              whileHover={{ scale: 1.1 }}
                              src={reward.imageUrl || undefined} 
                              alt={reward.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-slate-900 line-clamp-1">{reward.name}</h3>
                                <Badge variant="outline" className={`${statusColor} border-none shrink-0 ml-2`}>
                                  {status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(rr.date), 'dd/MM/yyyy HH:mm')}
                              </div>
                            </div>
                            
                            {rr.voucherCode && !rr.isUsed && !isExpired && (
                              <div className="mt-auto bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mã Voucher</span>
                                  <span className="font-mono font-bold text-slate-900">{rr.voucherCode}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600" onClick={() => copyToClipboard(rr.voucherCode!)}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Gift className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                </motion.div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Chưa có quà tặng nào được đổi</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6">Bạn chưa sử dụng điểm để đổi phần thưởng nào. Hãy khám phá các phần quà hấp dẫn và đổi ngay nhé!</p>
                <Button onClick={() => setActiveTab('available')} className="bg-red-600 hover:bg-red-700 text-white">
                  Khám phá quà tặng
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'event-gifts' && (
          <motion.div
            key="event-gifts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {myEventGifts.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm quà tặng sự kiện..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
                />
              </div>
            )}

            {myEventGifts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myEventGifts
                  .filter(gift => (gift.giftType || 'Quà tặng hiến máu').toLowerCase().includes(historySearch.toLowerCase()))
                  .sort((a, b) => {
                    const dateA = new Date(a.giftReceivedDate || a.date).getTime();
                    const dateB = new Date(b.giftReceivedDate || b.date).getTime();
                    if (isNaN(dateA) && isNaN(dateB)) return 0;
                    if (isNaN(dateA)) return 1;
                    if (isNaN(dateB)) return -1;
                    return dateB - dateA;
                  })
                  .map(gift => (
                    <Card key={gift.id} className="overflow-hidden flex flex-col sm:flex-row shadow-sm border-l-4 border-l-red-500">
                      <div className="w-full sm:w-32 h-32 sm:h-auto bg-red-50 flex items-center justify-center shrink-0">
                        <Gift className="w-12 h-12 text-red-500" />
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-slate-900">{gift.giftType || 'Quà tặng hiến máu'}</h3>
                            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 shrink-0 ml-2">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Đã nhận
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">Nhận tại sự kiện hiến máu</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(gift.giftReceivedDate || gift.date), 'dd/MM/yyyy')}
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">Phần thưởng tham gia</span>
                          <span className="text-xs font-bold text-amber-600">+10 điểm</span>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Gift className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                </motion.div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Chưa có lịch sử nhận quà</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-6">Bạn chưa nhận phần quà nào từ các sự kiện hiến máu. Hãy tham gia hiến máu để nhận những phần quà ý nghĩa nhé!</p>
                <Button onClick={() => window.location.href = '/events'} className="bg-red-600 hover:bg-red-700 text-white">
                  Xem sự kiện sắp tới
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};