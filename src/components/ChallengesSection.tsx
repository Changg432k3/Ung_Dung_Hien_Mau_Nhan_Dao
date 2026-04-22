import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Trophy, Users, Calendar, ArrowRight, Sparkles, CheckCircle2, Gift, Coins, Ticket, Award } from 'lucide-react';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const ChallengesSection: React.FC = () => {
  const { challenges, currentUser, joinChallenge, leaveChallenge, badges, rewards, redeemedRewards } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [completedChallengeId, setCompletedChallengeId] = useState<string | null>(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [pendingLeaveChallenge, setPendingLeaveChallenge] = useState<{ id: string; title: string } | null>(null);
  const prevCompletedChallenges = useRef<string[]>(currentUser?.completedChallenges || []);
  const { width, height } = useWindowSize();

  // Check for newly completed challenges
  useEffect(() => {
    if (currentUser?.completedChallenges) {
      const newCompleted = currentUser.completedChallenges.filter(
        id => !prevCompletedChallenges.current.includes(id)
      );
      
      if (newCompleted.length > 0) {
        // Show congratulatory effect for the first newly completed challenge
        setCompletedChallengeId(newCompleted[0]);
        setActiveTab('completed');
        setTimeout(() => setCompletedChallengeId(null), 6000);
      }
      
      prevCompletedChallenges.current = currentUser.completedChallenges;
    }
  }, [currentUser?.completedChallenges]);

  const getChallengeStatus = (challenge: any) => {
    const now = new Date();
    const start = parseISO(challenge.startDate);
    const end = parseISO(challenge.endDate);

    if (!isValid(start) || !isValid(end)) return 'unknown';
    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'active';
  };

  const joinedChallengeIds = currentUser?.joinedChallenges || [];
  const completedChallengeIds = currentUser?.completedChallenges || [];

  const availableChallenges = challenges.filter(challenge =>
    !joinedChallengeIds.includes(challenge.id) &&
    !completedChallengeIds.includes(challenge.id)
  );

  const participatingChallenges = challenges.filter(challenge =>
    joinedChallengeIds.includes(challenge.id) &&
    !completedChallengeIds.includes(challenge.id)
  );

  const completedChallenges = challenges.filter(challenge =>
    completedChallengeIds.includes(challenge.id)
  );

  const userBadges = badges.filter(b => 
    currentUser?.earnedBadges?.some(eb => eb.badgeId === b.id)
  );

  const userVouchers = redeemedRewards.filter(rr => rr.userId === currentUser?.id);

  const handleJoinChallenge = (challengeId: string) => {
    joinChallenge(challengeId);
    setActiveTab('participating');
  };

  const openLeaveModal = (challenge: { id: string; title: string }) => {
    setPendingLeaveChallenge(challenge);
    setLeaveModalOpen(true);
  };

  const closeLeaveModal = () => {
    setLeaveModalOpen(false);
    setPendingLeaveChallenge(null);
  };

  const confirmLeaveChallenge = () => {
    if (!pendingLeaveChallenge) return;
    leaveChallenge(pendingLeaveChallenge.id);
    setActiveTab('all');
    closeLeaveModal();
  };

  const renderChallengeCard = (challenge: any, isJoined: boolean, isCompleted: boolean, index: number) => {
    const startDate = parseISO(challenge.startDate);
    const endDate = parseISO(challenge.endDate);
    const isStartDateValid = isValid(startDate);
    const isEndDateValid = isValid(endDate);
    
    // Mock progress calculation
    const progress = isCompleted ? 100 : (isJoined ? 33 : 0); 
    const currentDonations = isCompleted ? challenge.targetDonations : (isJoined ? Math.floor(challenge.targetDonations * 0.33) : 0);
    const now = new Date();
    const isNewChallenge = isStartDateValid && Math.abs(differenceInDays(now, startDate)) <= 7;

    return (
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="overflow-hidden h-full flex flex-col border-2 hover:border-red-200 transition-all duration-300 relative group">
          <div className="relative h-40">
            <img
              src={challenge.imageUrl || undefined}
              alt={challenge.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {isNewChallenge && (
              <Badge className="absolute top-3 left-3 bg-white/90 text-red-600 text-[10px] uppercase tracking-[0.15em] shadow-sm border border-slate-200">
                Mới
              </Badge>
            )}
            <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
              <div className="flex gap-2">
                <Badge className="bg-red-600 text-white border-none">
                  <Coins className="w-3 h-3 mr-1" />
                  +{challenge.rewardPoints}
                </Badge>
                {challenge.rewardBadgeId && (
                  <Badge className="bg-amber-500 text-white border-none">
                    <Award className="w-3 h-3 mr-1" />
                    Huy hiệu
                  </Badge>
                )}
              </div>
              {isCompleted && (
                <Badge className="bg-green-500 text-white border-none flex gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Hoàn thành
                </Badge>
              )}
            </div>
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1">{challenge.title}</CardTitle>
            <CardDescription className="text-sm line-clamp-2 min-h-[2.5rem]">
              {challenge.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-grow space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{isStartDateValid ? format(startDate, 'dd/MM', { locale: vi }) : 'N/A'} - {isEndDateValid ? format(endDate, 'dd/MM/yy', { locale: vi }) : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{challenge.participants.length} người</span>
              </div>
            </div>

            {(isJoined || isCompleted) && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-600">Tiến độ</span>
                  <span className="text-red-600">{currentDonations}/{challenge.targetDonations} lần hiến</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="bg-red-600 h-full rounded-full"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 mt-auto">
              {isCompleted ? (
                <Button variant="outline" className="w-full border-green-200 text-green-700 bg-green-50 hover:bg-green-100" disabled>
                  <Trophy className="w-4 h-4 mr-2" />
                  Đã nhận thưởng
                </Button>
              ) : isJoined ? (
                <Button variant="outline" className="w-full border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100" onClick={() => openLeaveModal(challenge)}>
                  Hủy tham gia
                </Button>
              ) : (
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-200 group" 
                  onClick={() => handleJoinChallenge(challenge.id)}
                >
                  Tham gia ngay
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 relative">
      {completedChallengeId && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.12}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Thử thách hiến máu</h2>
          <p className="text-slate-500 text-sm">Tham gia các thử thách để lan tỏa yêu thương và nhận quà hấp dẫn.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-6 inline-flex w-full sm:w-auto">
          <TabsTrigger value="all" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Thử thách
            </div>
          </TabsTrigger>
          <TabsTrigger value="participating" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Đang tham gia
            </div>
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Đã hoàn thành
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availableChallenges.map((c, i) => renderChallengeCard(c, false, false, i))}

            {availableChallenges.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500">Hiện không có thử thách đang diễn ra nào.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="participating">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {participatingChallenges.map((c, i) => renderChallengeCard(c, true, false, i))}

            {participatingChallenges.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500">Bạn chưa tham gia thử thách nào.</p>
                <Button variant="link" className="text-red-600 mt-2" onClick={() => setActiveTab('all')}>
                  Khám phá thử thách mới
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {completedChallenges.map((c, i) => renderChallengeCard(c, true, true, i))}
            
            {completedChallenges.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500">Bạn chưa hoàn thành thử thách nào.</p>
                <Button variant="link" className="text-red-600 mt-2" onClick={() => setActiveTab('all')}>
                  Xem các thử thách đang diễn ra
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmationModal
        isOpen={leaveModalOpen}
        onClose={closeLeaveModal}
        onConfirm={confirmLeaveChallenge}
        title="Xác nhận hủy tham gia"
        description={`Bạn có chắc chắn muốn hủy tham gia thử thách "${pendingLeaveChallenge?.title || ''}"?`}
        confirmText="Hủy tham gia"
        cancelText="Quay lại"
        variant="warning"
      />
    </div>
  );
};

export default ChallengesSection;
