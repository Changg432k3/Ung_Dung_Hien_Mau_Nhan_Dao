import React from 'react';
import { Card, CardContent, CardFooter } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { MapPin, Users, CheckCircle2, Calendar, Star, Share2, Heart, Navigation } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

interface EventCardProps {
  event: any;
  userRecord?: any;
  isInterested?: boolean;
  reviews?: any[];
  userLocation?: { lat: number; lng: number } | null;
  calculateDistance?: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  toggleInterestedEvent?: (id: string) => void;
  onCancelRegistration?: (recordId: string, eventTitle: string) => void;
  className?: string;
  showHoverOverlay?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  userRecord,
  isInterested = false,
  reviews = [],
  userLocation,
  calculateDistance,
  toggleInterestedEvent,
  onCancelRegistration,
  className = '',
  showHoverOverlay = true
}) => {
  const navigate = useNavigate();
  const hasRegistered = userRecord && userRecord.status !== 'cancelled';
  const canCancel = hasRegistered && userRecord && (userRecord.status === 'registered' || userRecord.status === 'checked-in');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="info" className="bg-blue-500/90 backdrop-blur-md shadow-lg px-3 py-1 text-sm text-white border-none">Sắp diễn ra</Badge>;
      case 'ongoing':
        return <Badge variant="success" className="bg-emerald-500/90 backdrop-blur-md shadow-lg px-3 py-1 text-sm text-white border-none">Đang diễn ra</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-slate-500/90 backdrop-blur-md shadow-lg px-3 py-1 text-sm text-white border-none">Đã kết thúc</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card 
      className={`flex flex-col hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 group overflow-hidden border-slate-200/60 rounded-2xl cursor-pointer relative ${className}`}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className="h-64 sm:h-72 bg-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90"></div>
        <img 
          src={event.imageUrl || `https://picsum.photos/seed/${event.id}/800/600`} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
          referrerPolicy="no-referrer"
        />
        
        {/* Hover Summary Overlay */}
        {showHoverOverlay && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-center border-2 border-red-500/20">
            <h4 className="font-bold text-lg mb-2 text-slate-900">Tóm tắt sự kiện</h4>
            <p className="text-sm text-slate-600 line-clamp-4 mb-4">{event.description}</p>
            <div className="mt-auto text-sm text-slate-500 space-y-2">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /> {event.address || event.location}</p>
              <p className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Mục tiêu: {event.target} người</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã đăng ký: {event.registered} người</p>
            </div>
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-20">
          {getStatusBadge(event.status)}
          {hasRegistered && userRecord && (
            <Badge 
              variant={userRecord.status === 'completed' ? 'success' : userRecord.status === 'checked-in' ? 'default' : 'warning'}
              className="bg-opacity-90 backdrop-blur-md shadow-lg px-3 py-1 text-sm"
            >
              {userRecord.status === 'completed' ? 'Đã hoàn thành' : userRecord.status === 'checked-in' ? 'Đã check-in' : 'Đã đăng ký'}
            </Badge>
          )}
          <Badge 
            variant="outline" 
            className="bg-white/95 backdrop-blur-md shadow-lg border-none text-slate-800 px-3 py-1 text-sm font-semibold"
          >
            {event.category === 'urgent' ? 'Khẩn cấp' : event.category === 'special' ? 'Đặc biệt' : 'Định kỳ'}
          </Badge>
          {reviews.filter(r => r.eventId === event.id).length > 0 && (
            <Badge variant="outline" className="bg-white/95 backdrop-blur-md shadow-lg border-none text-slate-800 px-3 py-1 text-sm font-semibold flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {(reviews.filter(r => r.eventId === event.id).reduce((acc, curr) => acc + curr.rating, 0) / reviews.filter(r => r.eventId === event.id).length).toFixed(1)}
            </Badge>
          )}
          <Button 
            size="icon" 
            variant="outline" 
            className="bg-white/95 backdrop-blur-md shadow-lg border-none text-slate-800 w-9 h-9 rounded-full hover:bg-red-50 hover:text-red-600 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.share) {
                navigator.share({
                  title: event.title,
                  text: event.description,
                  url: window.location.origin + `/events/${event.id}`
                }).catch(console.error);
              } else {
                navigator.clipboard.writeText(window.location.origin + `/events/${event.id}`);
                toast.success('Đã sao chép liên kết sự kiện vào bộ nhớ tạm!');
              }
            }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          {toggleInterestedEvent && (
            <Button 
              size="icon" 
              variant="outline" 
              className={`bg-white/95 backdrop-blur-md shadow-lg border-none w-9 h-9 rounded-full transition-all ${isInterested ? 'text-red-500 hover:text-red-600' : 'text-slate-800 hover:text-red-600'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleInterestedEvent(event.id);
              }}
            >
              <Heart className={`w-4 h-4 ${isInterested ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform transition-transform duration-300">
          {hasRegistered && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 drop-shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Bạn đã đăng ký
            </div>
          )}
          <h3 className="text-white font-extrabold text-2xl line-clamp-2 leading-tight drop-shadow-lg mb-2">
            {event.title}
            {hasRegistered && userRecord && (
              <Badge 
                variant={userRecord.status === 'completed' ? 'success' : userRecord.status === 'checked-in' ? 'default' : 'warning'}
                className="ml-2 align-middle bg-opacity-90 backdrop-blur-md shadow-lg px-2 py-0.5 text-[10px] uppercase tracking-wider border-none"
              >
                {userRecord.status === 'completed' ? 'Đã hoàn thành' : userRecord.status === 'checked-in' ? 'Đã check-in' : 'Đã đăng ký'}
              </Badge>
            )}
          </h3>
          <div className="flex items-center gap-3 text-slate-100 text-sm font-medium drop-shadow-md">
            <span className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-red-400" /> 
              {event.startDate && event.endDate && event.startDate !== event.endDate 
                ? `${isValid(parseISO(event.startDate)) ? format(parseISO(event.startDate), 'dd/MM') : event.startDate} - ${isValid(parseISO(event.endDate)) ? format(parseISO(event.endDate), 'dd/MM/yyyy') : event.endDate}`
                : (isValid(parseISO(event.date)) ? format(parseISO(event.date), 'dd/MM/yyyy') : event.date)
              }
            </span>
          </div>
        </div>
      </div>
      
      <CardContent className="flex-1 pt-6">
        <div className="flex items-start gap-2 text-sm text-slate-600 mb-4">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
          <span className="line-clamp-2">{event.address || event.location}</span>
        </div>

        {userLocation && calculateDistance && event.lat && event.lng && (
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <Navigation className="w-4 h-4 shrink-0 text-blue-500" />
            <span>Cách bạn {calculateDistance(userLocation.lat, userLocation.lng, event.lat, event.lng)} km</span>
          </div>
        )}
        
        <div className="mt-auto pt-2">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-500 font-medium">Tiến độ đăng ký</span>
            <span className="font-bold text-slate-900">{event.registered} <span className="text-slate-400 font-normal">/ {event.target}</span></span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${event.registered >= event.target ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`} 
              style={{ width: `${Math.min(100, (event.registered / event.target) * 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full"></div>
              <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-right">
            {Math.round((event.registered / event.target) * 100)}% mục tiêu
          </p>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex flex-col gap-3 pb-5 px-6" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-2 gap-3 w-full">
          <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50" asChild>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address || event.location)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Navigation className="w-4 h-4 mr-2" /> Chỉ đường
            </a>
          </Button>
          
          {canCancel && onCancelRegistration ? (
            <Button 
              className="w-full shadow-sm text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200" 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCancelRegistration(userRecord.id, event.title);
              }}
            >
              Hủy đăng ký
            </Button>
          ) : !hasRegistered && event.status !== 'completed' ? (
            <Button 
              className="w-full shadow-sm" 
              variant="default" 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/events/${event.id}`);
              }}
            >
              Đăng ký
            </Button>
          ) : (
            <Button className="w-full shadow-sm" variant={event.status === 'completed' ? 'secondary' : 'default'} disabled={event.status === 'completed'} asChild={event.status !== 'completed'}>
              {event.status === 'completed' ? (
                <span>Đã kết thúc</span>
              ) : (
                <Link to={`/events/${event.id}`}>Chi tiết</Link>
              )}
            </Button>
          )}
        </div>

        {reviews.filter(r => r.eventId === event.id).length > 0 && (
          <Button 
            variant="ghost" 
            className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs h-8 flex items-center justify-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/events/${event.id}`);
            }}
          >
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            Xem {reviews.filter(r => r.eventId === event.id).length} đánh giá
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
