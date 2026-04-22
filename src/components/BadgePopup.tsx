import React, { useEffect, useState } from 'react';
import { useApp, Badge } from '../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Award, X, Share2 } from 'lucide-react';
import { Button } from './ui/Button';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export const BadgePopup: React.FC = () => {
  const { currentUser, badges, markBadgeAsSeen, addCommunityPost } = useApp();
  const [activeBadge, setActiveBadge] = useState<any>(null);
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (!currentUser || activeBadge) return; // Don't look for new badges if one is already showing

    // Find a badge that the user has earned but hasn't seen yet
    let earnedBadges: Badge[] = [];
    if (currentUser.earnedBadges && currentUser.earnedBadges.length > 0) {
        const earnedIds = currentUser.earnedBadges.map(b => b.badgeId);
        earnedBadges = badges.filter(b => earnedIds.includes(b.id));
    } else {
        // Fallback for old users or if earnedBadges is not populated
        earnedBadges = badges.filter(b => currentUser.donationsCount >= b.condition);
    }

    // The seenBadges logic should use IDs.
    const unseenBadges = earnedBadges.filter(b => !currentUser.seenBadges?.includes(b.id));

    if (unseenBadges.length > 0) {
      // Show the highest level unseen badge
      const highestBadge = unseenBadges.sort((a, b) => b.condition - a.condition)[0];
      console.log('BadgePopup Debug:', { highestBadge });
      setActiveBadge(highestBadge);
      // Mark it as seen immediately so it doesn't show again even if they don't click close
      markBadgeAsSeen(highestBadge.id);
    }
  }, [currentUser, badges, markBadgeAsSeen, activeBadge]);

  const handleClose = () => {
    setActiveBadge(null);
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'Gold': return 'from-yellow-400 to-amber-600 shadow-yellow-500/50';
      case 'Silver': return 'from-slate-300 to-slate-500 shadow-slate-400/50';
      case 'Bronze': return 'from-amber-600 to-orange-800 shadow-orange-700/50';
      default: return 'from-blue-400 to-indigo-600 shadow-blue-500/50';
    }
  };

  return (
    <AnimatePresence>
      {activeBadge && (
        <motion.div 
          key="badge-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
        >
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.15}
          />
          
          <motion.div
            key={activeBadge.id}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
          {/* Close button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Background */}
          <div className="h-48 bg-slate-900 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            
            {/* Glowing effect behind badge */}
            <div className={`absolute w-32 h-32 rounded-full blur-3xl bg-gradient-to-br ${getBadgeColor(activeBadge.level)} opacity-60`}></div>
            
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', damping: 15 }}
              className={`relative z-10 w-28 h-28 rounded-full bg-gradient-to-br ${getBadgeColor(activeBadge.level)} p-1 shadow-2xl flex items-center justify-center`}
            >
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-4 border-white/20">
                <Award className="w-12 h-12 text-white" />
              </div>
            </motion.div>
          </div>

          <div className="p-8 text-center space-y-6">
            <div className="space-y-2">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm font-bold tracking-widest text-slate-400 uppercase"
              >
                Thành tích mới
              </motion.p>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-3xl font-extrabold text-slate-900"
              >
                {activeBadge.name}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-slate-600 leading-relaxed"
              >
                Chúc mừng bạn đã đạt được huy hiệu <span className="font-semibold text-slate-900">{activeBadge.name}</span>. 
                {activeBadge.conditionType === 'donations' && `Cảm ơn bạn vì ${activeBadge.condition} lần hiến máu cứu người!`}
                {activeBadge.conditionType === 'events' && `Cảm ơn bạn vì đã tham gia ${activeBadge.condition} sự kiện!`}
                {activeBadge.conditionType === 'referrals' && `Cảm ơn bạn vì đã giới thiệu ${activeBadge.condition} người tham gia!`}
                {activeBadge.conditionType === 'active_time' && `Cảm ơn bạn vì đã hoạt động ${activeBadge.condition} giờ!`}
                {!activeBadge.conditionType && `Chúc mừng bạn đã đạt được thành tích này!`}
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 pt-4"
            >
              <Button 
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                onClick={handleClose}
              >
                Tuyệt vời!
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-slate-200 hover:bg-slate-50"
                onClick={() => {
                  if (currentUser) {
                    addCommunityPost({
                      userId: currentUser.id,
                      content: `Mình vừa đạt được ${activeBadge.name} vì đã hiến máu ${activeBadge.condition} lần! Cảm ơn Máu+ đã đồng hành cùng mình.`,
                      type: 'achievement',
                      badgeId: activeBadge.id
                    });
                  }
                  handleClose();
                }}
              >
                <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};