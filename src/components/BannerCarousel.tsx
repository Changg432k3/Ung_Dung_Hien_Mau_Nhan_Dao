import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const BANNER_SLIDES = [
  {
    id: 1,
    title: 'Hiến máu cứu người - Một nghĩa cử cao đẹp',
    description: 'Mỗi giọt máu cho đi, một cuộc đời ở lại. Hãy cùng chúng tôi lan tỏa yêu thương đến cộng đồng.',
    image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=1200&auto=format&fit=crop',
    ctaText: 'Đăng ký ngay',
    ctaLink: '/events',
    color: 'from-red-900/80 to-red-600/60'
  },
  {
    id: 2,
    title: 'Khẩn cấp: Cần nhóm máu O và A',
    description: 'Bệnh viện Chợ Rẫy đang thiếu hụt nghiêm trọng nhóm máu O và A. Rất mong nhận được sự hỗ trợ từ cộng đồng.',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1200&auto=format&fit=crop',
    ctaText: 'Xem chi tiết',
    ctaLink: '/events/e3',
    color: 'from-slate-900/80 to-red-900/60'
  },
  {
    id: 3,
    title: 'Lễ hội Xuân Hồng 2024',
    description: 'Sự kiện hiến máu lớn nhất đầu năm đã chính thức khởi động. Hàng ngàn phần quà hấp dẫn đang chờ đón bạn.',
    image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=1200&auto=format&fit=crop',
    ctaText: 'Tham gia ngay',
    ctaLink: '/events/e4',
    color: 'from-rose-900/80 to-pink-700/60'
  }
];

export const BannerCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '50%' : '-50%',
      opacity: 0,
      scale: 0.9
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '50%' : '-50%',
      opacity: 0,
      scale: 1.1
    })
  };

  const transition = {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
    mass: 1
  };

  return (
    <div 
      className="relative w-full h-[300px] sm:h-[350px] md:h-[450px] rounded-3xl overflow-hidden group shadow-2xl bg-slate-100"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              handleNext();
            } else if (swipe > swipeConfidenceThreshold) {
              handlePrev();
            }
          }}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {/* Background Image with Skeleton Fallback */}
          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
          <img
            src={BANNER_SLIDES[currentIndex].image || undefined}
            alt={BANNER_SLIDES[currentIndex].title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="eager"
          />
          
          {/* Multi-layered Gradient Overlay for better text legibility */}
          <div className={`absolute inset-0 bg-gradient-to-r ${BANNER_SLIDES[currentIndex].color} opacity-90 mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end md:justify-center p-6 sm:p-10 md:px-20 max-w-4xl z-10">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8 md:mb-0"
            >
              <Badge variant="outline" className="text-white border-white/40 bg-white/20 backdrop-blur-md mb-3 md:mb-6 px-3 py-1 text-[10px] md:text-xs uppercase tracking-widest font-bold">
                Tin nổi bật
              </Badge>
              <h2 className="text-2xl sm:text-4xl md:text-6xl font-black text-white mb-3 md:mb-6 leading-[1.1] tracking-tight drop-shadow-lg">
                {BANNER_SLIDES[currentIndex].title}
              </h2>
              <p className="text-white/90 text-sm sm:text-lg md:text-xl mb-6 md:mb-10 line-clamp-2 md:line-clamp-none max-w-2xl font-medium leading-relaxed">
                {BANNER_SLIDES[currentIndex].description}
              </p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  delay: 0.4, 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 15 
                }}
                className="flex flex-wrap gap-4"
              >
                <Button 
                  size="lg" 
                  className="bg-white text-red-600 hover:bg-red-50 font-bold shadow-2xl text-sm md:text-lg h-12 md:h-14 px-8 md:px-10 rounded-full transition-all hover:scale-105 active:scale-95" 
                  asChild
                >
                  <Link to={BANNER_SLIDES[currentIndex].ctaLink}>
                    {BANNER_SLIDES[currentIndex].ctaText} <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls - Hidden on mobile, visible on hover for desktop */}
      <div className="hidden lg:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-6 opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 pointer-events-none">
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all pointer-events-auto shadow-2xl"
          aria-label="Slide trước"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all pointer-events-auto shadow-2xl"
          aria-label="Slide tiếp theo"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
        {BANNER_SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className="group py-2 px-1"
            aria-label={`Chuyển đến slide ${index + 1}`}
          >
            <div className={`h-1.5 rounded-full transition-all duration-500 ${
              index === currentIndex 
                ? 'bg-white w-12 shadow-[0_0_10px_rgba(255,255,255,0.8)]' 
                : 'bg-white/30 group-hover:bg-white/60 w-3'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
};
