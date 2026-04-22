import React, { useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Button } from './ui/Button';
import { Gift, RotateCw, Star } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { toast } from 'sonner';

const LuckyWheel: React.FC = () => {
  const { spinWheel, currentUser } = useApp();
  const [isSpinning, setIsSpinning] = useState(false);
  const controls = useAnimation();
  const [lastPrize, setLastPrize] = useState<string | null>(null);

  const prizes = [
    { name: '10 điểm', color: '#f87171', label: '10 PT' },
    { name: '20 điểm', color: '#fbbf24', label: '20 PT' },
    { name: '50 điểm', color: '#34d399', label: '50 PT' },
    { name: '100 điểm', color: '#60a5fa', label: '100 PT' },
    { name: 'Voucher 10%', color: '#f472b6', label: 'VC 10%' },
    { name: 'Voucher 20%', color: '#ec4899', label: 'VC 20%' },
    { name: 'Voucher 50%', color: '#db2777', label: 'VC 50%' },
    { name: 'Huy hiệu 💎', color: '#a78bfa', label: 'BADGE' },
    { name: '❌ Ô xui', color: '#94a3b8', label: 'LUCK' },
    { name: '❌ Ô xui', color: '#64748b', label: 'LUCK' },
  ];

  const handleSpin = async () => {
    if (isSpinning) return;
    if ((currentUser?.points || 0) < 10) {
      toast.error('Bạn cần ít nhất 10 điểm để quay vòng quay may mắn!');
      return;
    }

    setIsSpinning(true);
    
    // Rotate multiple times + random offset
    const rotation = 1800 + Math.random() * 360;
    
    await controls.start({
      rotate: rotation,
      transition: { duration: 4, ease: [0.15, 0, 0.15, 1] } // Custom ease for smoother stop
    });

    const result = spinWheel();
    if (result.success) {
      setLastPrize(result.message);
      if (result.message.includes('❌')) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
      }
    }
    
    setIsSpinning(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center">
      <div className="flex items-center gap-3 mb-6 w-full">
        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Vòng quay may mắn</h2>
          <p className="text-xs text-slate-500">Thử vận may để nhận thêm điểm thưởng (10đ/lượt).</p>
        </div>
      </div>

      <div className="relative w-72 h-72 mb-8">
        {/* Pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-red-600 drop-shadow-md" />
        
        <motion.div 
          animate={controls}
          className="w-full h-full rounded-full border-4 border-slate-800 relative shadow-2xl"
          style={{ transformOrigin: 'center' }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {prizes.map((prize, index) => {
              const angle = 360 / prizes.length;
              const startAngle = angle * index;
              const endAngle = angle * (index + 1);
              
              // SVG arc calculation
              const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
              
              const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
              
              return (
                <g key={`prize-${index}`}>
                  <path d={pathData} fill={prize.color} stroke="white" strokeWidth="0.5" />
                  <text
                    x="75"
                    y="50"
                    fill="white"
                    fontSize="3.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    transform={`rotate(${startAngle + angle / 2}, 50, 50)`}
                  >
                    {prize.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </motion.div>
        
        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-slate-800 border-4 border-white shadow-lg flex items-center justify-center z-20">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center">
            <Star className="w-6 h-6 text-white fill-current animate-pulse" />
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSpin} 
        disabled={isSpinning}
        className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-red-100 transition-all active:scale-95"
      >
        {isSpinning ? (
          <RotateCw className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Gift className="w-5 h-5 mr-2" />
        )}
        {isSpinning ? 'Đang quay...' : 'Quay ngay (10đ)'}
      </Button>

      {lastPrize && !isSpinning && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mt-4 p-3 rounded-xl w-full text-center font-bold text-sm ${
            lastPrize.includes('❌') ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600 border border-red-100'
          }`}
        >
          {lastPrize}
        </motion.div>
      )}
    </div>
  );
};

export default LuckyWheel;
