import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Button } from './ui/Button';
import { Brain, Trophy, CheckCircle2, XCircle, ArrowRight, Star, Timer, Award, Flame, Zap, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const MiniQuizWidget: React.FC = () => {
  const { quizzes, submitQuizAnswer, userQuizAttempts, currentUser } = useApp();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; pointsEarned: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Determine daily quiz based on current date
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const dailyQuizIndex = dayOfYear % quizzes.length;
  const currentQuiz = quizzes[dailyQuizIndex];
  
  const todayStr = today.toISOString().split('T')[0];
  const hasPlayedToday = currentUser?.lastGamePlayDate === todayStr;
  
  // Find today's attempt if already played
  const todayAttempt = userQuizAttempts.find(a => a.userId === currentUser?.id && a.quizId === currentQuiz?.id && a.date.startsWith(todayStr));

  useEffect(() => {
    if (hasPlayedToday) {
      setIsSubmitted(true);
      if (todayAttempt) {
        setSelectedOption(todayAttempt.isCorrect ? currentQuiz.correctAnswer : -1); // -1 if we don't know what they picked, but we can just show correct answer
      }
    }
  }, [hasPlayedToday, todayAttempt, currentQuiz]);

  useEffect(() => {
    if (!isSubmitted && !hasPlayedToday && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted && !hasPlayedToday) {
      setIsTimeUp(true);
      handleTimeUp();
    }
  }, [timeLeft, isSubmitted, hasPlayedToday]);

  if (!currentQuiz) return null;

  const handleTimeUp = async () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để tham gia trả lời câu hỏi.');
      // Reset timer so they can try again after logging in
      setTimeLeft(15);
      setIsTimeUp(false);
      return;
    }
    const res = await submitQuizAnswer(currentQuiz.id, -1); // -1 means no answer/time up
    setResult(res);
    setIsSubmitted(true);
    toast.error(res.message || 'Hết thời gian rồi! Hãy quay lại vào ngày mai nhé.');
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để tham gia trả lời câu hỏi.');
      return;
    }
    if (selectedOption === null) {
      toast.error('Vui lòng chọn một đáp án.');
      return;
    }
    
    const res = await submitQuizAnswer(currentQuiz.id, selectedOption);
    setResult(res);
    setIsSubmitted(true);
    if (res.success) {
      toast.success(res.message || `+${res.pointsEarned} điểm! Chúc mừng bạn.`);
    } else {
      toast.error(res.message || 'Rất tiếc, đáp án chưa chính xác.');
    }
  };

  const timerProgress = (timeLeft / 15) * 100;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
        <div className="flex items-center gap-2 text-indigo-600">
          <Calendar className="w-5 h-5" />
          <h2 className="font-bold">Câu hỏi mỗi ngày</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-orange-50 rounded-lg border border-orange-100 text-orange-600">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span className="text-[10px] font-bold">{currentUser?.dailyStreak || 0}d</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-600">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="text-[10px] font-bold">Lv.{currentUser?.gameLevel || 1}</span>
          </div>
          {!hasPlayedToday && !isSubmitted && (
            <motion.div 
              animate={timeLeft <= 5 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border shadow-sm transition-colors ${
                timeLeft <= 5 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-indigo-100 text-indigo-700'
              }`}
            >
              <Timer className={`w-3.5 h-3.5 ${timeLeft <= 5 ? 'animate-spin-slow' : ''}`} />
              <span className="text-xs font-bold tabular-nums">{timeLeft}s</span>
            </motion.div>
          )}
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">
            <Star className="w-3 h-3 text-amber-500 fill-current" />
            <span className="text-[10px] font-bold text-indigo-700">{currentUser?.points || 0}đ</span>
          </div>
        </div>
      </div>
      
      {/* Timer Progress Bar */}
      {!hasPlayedToday && !isSubmitted && (
        <div className="h-1 w-full bg-slate-100">
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ 
              width: `${timerProgress}%`,
              backgroundColor: timeLeft <= 5 ? '#ef4444' : '#4f46e5'
            }}
            transition={{ duration: 1, ease: 'linear' }}
            className="h-full"
          />
        </div>
      )}
      
      <div className="p-5 space-y-4">
        {hasPlayedToday ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Bạn đã hoàn thành câu hỏi hôm nay!</h3>
            <p className="text-sm text-slate-500">Hãy quay lại vào ngày mai để tiếp tục chuỗi ngày (Streak) và nhận thêm điểm thưởng nhé.</p>
            
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-left">
              <p className="text-xs text-indigo-500 font-bold uppercase mb-2">Câu hỏi hôm nay</p>
              <p className="text-sm font-medium text-slate-900 mb-3">{currentQuiz.question}</p>
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span><strong className="text-slate-900">Đáp án đúng:</strong> {currentQuiz.options[currentQuiz.correctAnswer]}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                <strong>Giải thích:</strong> {currentQuiz.explanation}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                <span>Câu hỏi hôm nay</span>
                <span className="text-indigo-500">{currentQuiz.category.replace('_', ' ')}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {currentQuiz.question}
              </h3>
            </div>

            <div className="space-y-2">
              {currentQuiz.options.map((option, index) => {
                const isCorrect = index === currentQuiz.correctAnswer;
                const isSelected = selectedOption === index;
                const disabled = isSubmitted;

                let bgColor = "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100";
                if (disabled) {
                  if (isCorrect) bgColor = "bg-green-50 border-green-200 text-green-700";
                  else if (isSelected) bgColor = "bg-red-50 border-red-200 text-red-700";
                  else bgColor = "bg-slate-50 border-slate-50 text-slate-400 opacity-60";
                } else if (isSelected) {
                  bgColor = "bg-indigo-50 border-indigo-200 text-indigo-700";
                }

                return (
                  <button
                    key={`option-${index}`}
                    disabled={disabled}
                    onClick={() => setSelectedOption(index)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${bgColor}`}
                  >
                    <span>{option}</span>
                    {disabled && isCorrect && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    {disabled && isSelected && !isCorrect && <XCircle className="w-3 h-3 text-red-500" />}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {isTimeUp ? <Timer className="w-3 h-3 text-red-500" /> : <Award className="w-3 h-3 text-indigo-500" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      <span className="font-bold text-slate-700">Giải thích: </span>
                      {currentQuiz.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isSubmitted && (
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs h-9 shadow-lg shadow-indigo-200"
                onClick={handleSubmit}
                disabled={selectedOption === null}
              >
                Gửi đáp án
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default MiniQuizWidget;