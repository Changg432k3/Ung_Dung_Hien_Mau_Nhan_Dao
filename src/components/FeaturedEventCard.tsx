import React, { useState, useEffect } from 'react';
import { MapPin, Hourglass, Droplets, Calendar, ArrowRight, CheckCircle2, AlertCircle, Share2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useApp } from '../store/AppContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO, addMonths, isAfter } from 'date-fns';
import { vi } from 'date-fns/locale';
import { safeParseDate } from '../lib/dateUtils';

export const FeaturedEventCard: React.FC = () => {
  const { events, currentUser } = useApp();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Find the first upcoming event
  const featuredEvent = events.find(e => e.status === 'upcoming') || events[0];

  useEffect(() => {
    if (!featuredEvent) return;

    const targetDate = safeParseDate(featuredEvent.startDate || featuredEvent.date) || new Date();
    
    const calculateTimeLeft = () => {
      const now = new Date();
      if (now >= targetDate) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: differenceInDays(targetDate, now),
        hours: differenceInHours(targetDate, now) % 24,
        minutes: differenceInMinutes(targetDate, now) % 60,
        seconds: differenceInSeconds(targetDate, now) % 60
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [featuredEvent]);

  if (!featuredEvent) return null;

  // Calculate eligibility if user is logged in
  let eligibilityMessage = null;
  let isEligible = false;
  let daysToWait = 0;

  if (currentUser) {
    const lastDonationDate = safeParseDate(currentUser.lastDonationDate);
    const nextDonationDate = lastDonationDate ? addMonths(lastDonationDate, 3) : new Date();
    const now = new Date();
    
    isEligible = !lastDonationDate || isAfter(now, nextDonationDate) || now.getTime() === nextDonationDate.getTime();
    daysToWait = lastDonationDate ? Math.max(0, differenceInDays(nextDonationDate, now)) : 0;

    if (isEligible) {
      eligibilityMessage = (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mt-4 w-fit border border-emerald-100">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">Bạn đủ điều kiện tham gia</span>
        </div>
      );
    } else {
      eligibilityMessage = (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-4 w-fit border border-amber-100">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">Bạn cần chờ {daysToWait} ngày nữa để hiến tiếp</span>
        </div>
      );
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: featuredEvent.title,
        text: featuredEvent.description,
        url: window.location.origin + `/events/${featuredEvent.id}`
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.origin + `/events/${featuredEvent.id}`);
      toast.success('Đã sao chép liên kết sự kiện vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 group flex flex-col md:flex-row">
      {/* Image Section */}
      <div className="w-full md:w-2/5 h-48 md:h-auto relative overflow-hidden">
        <img 
          src={featuredEvent.imageUrl || "https://picsum.photos/seed/blood-donation-event/800/600"} 
          alt={featuredEvent.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/60 hidden md:block"></div>
        
        <div className="absolute bottom-4 left-4 md:bottom-auto md:top-4 md:right-4 md:left-auto flex flex-col gap-2 items-end">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold uppercase tracking-wider shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Sự kiện nổi bật
          </div>
          {featuredEvent.status === 'upcoming' && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold shadow-lg">
              Sắp diễn ra
            </div>
          )}
          {featuredEvent.status === 'ongoing' && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-lg">
              Đang diễn ra
            </div>
          )}
          {featuredEvent.status === 'completed' && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-500 text-white text-xs font-semibold shadow-lg">
              Đã kết thúc
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full md:w-3/5 p-6 sm:p-8 flex flex-col justify-between bg-white relative z-10">
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2">
            {featuredEvent.title}
          </h2>
          
          <p className="text-slate-600 line-clamp-2">
            {featuredEvent.description || "Hãy cùng chung tay hiến máu cứu người, một nghĩa cử cao đẹp vì cộng đồng."}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{format(parseISO(featuredEvent.date), 'dd/MM/yyyy', { locale: vi })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="line-clamp-1 max-w-[200px]">{featuredEvent.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-red-500" />
              <span className="text-red-600">Mục tiêu: {featuredEvent.target} đv</span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sự kiện sẽ diễn ra sau</p>
            <div className="flex gap-3 sm:gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-xl sm:text-2xl font-bold text-slate-800 shadow-sm">
                  {timeLeft.days.toString().padStart(2, '0')}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 uppercase">Ngày</span>
              </div>
              <div className="text-2xl font-bold text-slate-300 mt-2 sm:mt-3">:</div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-xl sm:text-2xl font-bold text-slate-800 shadow-sm">
                  {timeLeft.hours.toString().padStart(2, '0')}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 uppercase">Giờ</span>
              </div>
              <div className="text-2xl font-bold text-slate-300 mt-2 sm:mt-3">:</div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-xl sm:text-2xl font-bold text-slate-800 shadow-sm">
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 uppercase">Phút</span>
              </div>
              <div className="text-2xl font-bold text-slate-300 mt-2 sm:mt-3">:</div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-xl sm:text-2xl font-bold text-red-600 shadow-sm">
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 mt-1 uppercase">Giây</span>
              </div>
            </div>
          </div>

          {/* Eligibility Message */}
          {eligibilityMessage}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-500 italic">
            "Một giọt máu cho đi, một cuộc đời ở lại"
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="lg" 
              className="flex-1 sm:flex-none border-slate-200 hover:bg-slate-50 gap-2"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" /> Chia sẻ
            </Button>
            <Button size="lg" asChild className="flex-1 sm:flex-none shadow-sm group-hover:shadow-md transition-all bg-red-600 hover:bg-red-700 text-white gap-2">
              <Link to={`/events/${featuredEvent.id}`}>
                Đăng ký ngay <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
