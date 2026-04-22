import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Calendar, MapPin, Clock, Users, ArrowLeft, Heart, CheckCircle2, AlertCircle, XCircle, Navigation, Info, Star, Share2, ShieldCheck, Trophy, Award, BookOpen, Coins, ChevronRight, Activity, ShieldAlert, Syringe, Scale, Pill, Moon, Droplet, ChevronDown } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import QRCode from 'react-qr-code';
import { QRScanner } from '../components/QRScanner';
import { motion, AnimatePresence } from 'motion/react';

import confetti from 'canvas-confetti';

const SCREENING_QUESTIONS = [
  { 
    id: 'q1', 
    text: 'Bạn có cảm thấy khỏe mạnh trong ngày hôm nay không?', 
    description: 'Đảm bảo bạn không có triệu chứng sốt, ho, mệt mỏi hoặc các vấn đề sức khỏe cấp tính.',
    expected: true,
    icon: <Activity className="w-6 h-6 text-blue-500" />,
    isCritical: true,
    warningText: 'Sức khỏe không ổn định có thể gây nguy hiểm khi hiến máu.'
  },
  { 
    id: 'q2', 
    text: 'Bạn có đang mắc các bệnh lây truyền qua đường máu không?', 
    description: 'Bao gồm HIV, Viêm gan B, Viêm gan C, Giang mai, v.v.',
    expected: false,
    icon: <ShieldAlert className="w-6 h-6 text-red-500" />,
    isCritical: true,
    warningText: 'Bệnh truyền nhiễm là rào cản tuyệt đối để đảm bảo an toàn cho người nhận.'
  },
  { 
    id: 'q3', 
    text: 'Bạn có xăm hình, xỏ khuyên hoặc phẫu thuật trong 6 tháng qua không?', 
    description: 'Các thủ tục này cần thời gian để đảm bảo không có nguy cơ lây nhiễm.',
    expected: false,
    icon: <Syringe className="w-6 h-6 text-purple-500" />,
    isCritical: false
  },
  { 
    id: 'q4', 
    text: 'Bạn có sụt cân không rõ nguyên nhân trong thời gian gần đây không?', 
    description: 'Sụt cân đột ngột có thể là dấu hiệu của các vấn đề sức khỏe cần được kiểm tra.',
    expected: false,
    icon: <Scale className="w-6 h-6 text-amber-500" />,
    isCritical: false
  },
  { 
    id: 'q5', 
    text: 'Bạn có đang dùng thuốc kháng sinh hoặc thuốc điều trị bệnh cấp tính không?', 
    description: 'Một số loại thuốc có thể ảnh hưởng đến chất lượng máu hoặc sức khỏe người nhận.',
    expected: false,
    icon: <Pill className="w-6 h-6 text-emerald-500" />,
    isCritical: true,
    warningText: 'Thuốc trong máu có thể gây phản ứng phụ cho người nhận.'
  },
  { 
    id: 'q6', 
    text: 'Bạn có cân nặng trên 45kg (nữ) hoặc 50kg (nam) không?', 
    description: 'Cân nặng tối thiểu để đảm bảo an toàn cho người hiến máu.',
    expected: true,
    icon: <Users className="w-6 h-6 text-indigo-500" />,
    isCritical: true,
    warningText: 'Cân nặng không đủ có thể dẫn đến tình trạng sốc hoặc ngất xỉu.'
  },
  { 
    id: 'q7', 
    text: 'Bạn có ngủ đủ ít nhất 6 tiếng vào đêm qua không?', 
    description: 'Giấc ngủ đầy đủ giúp cơ thể ổn định và tránh tình trạng chóng mặt sau khi hiến.',
    expected: true,
    icon: <Moon className="w-6 h-6 text-slate-500" />,
    isCritical: false
  },
];

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, currentUser, records, registerForEvent, userLocation, calculateDistance, checkInUser, completeDonation, cancelRegistration, reviews, addReview, users } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showScreening, setShowScreening] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedRecordId, setScannedRecordId] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(350);
  const [adminTab, setAdminTab] = useState<'info' | 'participants'>('info');
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({
    q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [screeningFailed, setScreeningFailed] = useState(false);
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [expectedAmount, setExpectedAmount] = useState<number>(250);

  const event = events.find(e => e.id === id);
  const userRecords = records.filter(r => r.eventId === id && r.userId === currentUser?.id).sort((a,b) => b.id.localeCompare(a.id));
  const userRecord = userRecords.length > 0 ? userRecords[0] : null;
  const hasRegistered = userRecord && userRecord.status !== 'cancelled';

  const nextDonationDate = currentUser?.lastDonationDate && !isNaN(new Date(currentUser.lastDonationDate).getTime())
    ? new Date(new Date(currentUser.lastDonationDate).getTime() + 90 * 24 * 60 * 60 * 1000) 
    : new Date();
  const canDonate = nextDonationDate <= new Date();
  const daysRemaining = Math.max(0, Math.ceil((nextDonationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy sự kiện</h2>
        <Button variant="link" onClick={() => navigate('/events')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  const handleStartRegistration = () => {
    setShowScreening(true);
    setAnswers({ q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null });
    setCurrentStep(0);
    setScreeningFailed(false);
    setFailedQuestion(null);
    setShowReview(false);
  };

  const handleAnswer = (questionId: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    const question = SCREENING_QUESTIONS.find(q => q.id === questionId);
    if (question && value !== question.expected) {
      setScreeningFailed(true);
      setFailedQuestion(question.text);
    } else if (currentStep < SCREENING_QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    } else {
      // Last question answered successfully
      setTimeout(() => setShowReview(true), 300);
    }
  };

  const handleSubmitScreening = () => {
    setShowScreening(false);
    handleRegister();
  };

  const handleScan = (decodedText: string) => {
    if (decodedText.startsWith('checkin:')) {
      const recordId = decodedText.split(':')[1];
      setScannedRecordId(recordId);
      setShowScanner(false);
    } else {
      alert('Mã QR không hợp lệ.');
    }
  };

  const scannedRecord = records.find(r => r.id === scannedRecordId);
  const scannedUser = scannedRecord ? users.find(u => u.id === scannedRecord.userId) : null;

  useEffect(() => {
    if (scannedRecord?.expectedAmount) {
      setDonationAmount(scannedRecord.expectedAmount);
    }
  }, [scannedRecord?.id, scannedRecord?.expectedAmount]);

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const result = await registerForEvent(event.id, expectedAmount);
      setIsRegistering(false);
      if (result.success) {
        setShowSuccess(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f83b58', '#ffffff', '#627ee0']
        });
      } else {
        alert(result.message);
      }
    } catch (error) {
      setIsRegistering(false);
      alert('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    }
  };

  const allAnswered = Object.values(answers).every(a => a !== null);

  const eventRecords = records.filter(r => r.eventId === event.id);
  const registeredCount = eventRecords.filter(r => r.status !== 'cancelled').length;
  const checkedInCount = eventRecords.filter(r => r.status === 'checked-in').length;
  const completedCount = eventRecords.filter(r => r.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between -ml-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
        <div className="flex gap-2">
          {currentUser?.role === 'admin' && (
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Button 
                variant={adminTab === 'info' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => setAdminTab('info')}
              >
                Thông tin
              </Button>
              <Button 
                variant={adminTab === 'participants' ? 'default' : 'ghost'} 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => setAdminTab('participants')}
              >
                Người tham gia ({registeredCount})
              </Button>
            </div>
          )}
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: event.title,
                text: event.description,
                url: window.location.href
              }).catch(console.error);
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Đã sao chép liên kết sự kiện vào bộ nhớ tạm!');
            }
          }}
        >
          <Share2 className="w-4 h-4" /> Chia sẻ
        </Button>
        </div>
      </div>

      {adminTab === 'participants' && currentUser?.role === 'admin' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase">Đã đăng ký</p>
                  <p className="text-2xl font-black text-blue-900">{registeredCount}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase">Đã check-in</p>
                  <p className="text-2xl font-black text-amber-900">{checkedInCount}</p>
                </div>
                <ShieldCheck className="w-8 h-8 text-amber-200" />
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-100">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase">Hoàn thành</p>
                  <p className="text-2xl font-black text-emerald-900">{completedCount}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-200" />
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Danh sách người tham gia</CardTitle>
              <Button size="sm" className="gap-2" onClick={() => setShowScanner(true)}>
                <Heart className="w-4 h-4" /> Quét mã mới
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-medium">Người hiến</th>
                      <th className="px-6 py-3 font-medium">Nhóm máu</th>
                      <th className="px-6 py-3 font-medium">Trạng thái</th>
                      <th className="px-6 py-3 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventRecords.map((record) => {
                      const user = users.find(u => u.id === record.userId);
                      if (!user) return null;
                      return (
                        <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                                <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt={user.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{user.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono uppercase">{record.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-red-600 border-red-100 bg-red-50">{user.bloodGroup || '?'}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={record.status === 'completed' ? 'success' : record.status === 'checked-in' ? 'default' : record.status === 'cancelled' ? 'secondary' : 'warning'}>
                              {record.status === 'completed' ? 'Đã hoàn thành' : record.status === 'checked-in' ? 'Đã check-in' : record.status === 'cancelled' ? 'Đã hủy' : 'Đã đăng ký'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              onClick={() => setScannedRecordId(record.id)}
                            >
                              Xử lý
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {eventRecords.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Chưa có người đăng ký tham gia sự kiện này.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Event Info */}
          <div className="lg:col-span-2 space-y-8">
            {showSuccess && (
              <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 w-full">
              <h3 className="text-lg font-bold text-emerald-900">Đăng ký thành công!</h3>
              <p className="text-emerald-700 mt-1 font-medium">Cảm ơn bạn đã góp phần cứu người! 🎉</p>
              <p className="text-emerald-700 mt-2">Bạn đã đăng ký tham gia sự kiện "{event.title}". Vui lòng lưu lại mã QR dưới đây để check-in tại sự kiện.</p>
              
              {userRecord && (
                <div className="mt-6 flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-emerald-100 shadow-sm max-w-sm mx-auto">
                  <p className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Mã QR Check-in</p>
                  <div className="p-3 bg-white rounded-xl border-2 border-slate-100 shadow-inner">
                    <QRCode value={`checkin:${userRecord.id}`} size={180} />
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <p className="text-xs font-medium text-slate-500 uppercase">Mã Check-in văn bản</p>
                    <div className="px-4 py-2 bg-slate-100 rounded-lg border border-slate-200">
                      <p className="text-lg font-mono font-black text-slate-800 tracking-widest">{userRecord.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 text-center mb-6">Đưa mã này cho nhân viên y tế tại sự kiện để làm thủ tục nhanh chóng.</p>
                  
                  <div className="w-full space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200 font-semibold"
                      onClick={() => setIsConfirmModalOpen(true)}
                    >
                      Hủy đăng ký
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-3">
                <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100" onClick={() => navigate('/history')}>
                  Xem lịch sử của tôi
                </Button>
                <Button variant="ghost" className="text-emerald-700 hover:bg-emerald-100" onClick={() => setShowSuccess(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

          <div className="rounded-2xl overflow-hidden shadow-md relative h-64 md:h-80">
            <img src={event.imageUrl || `https://picsum.photos/seed/${event.id}/1200/600`} alt={event.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={event.status === 'upcoming' ? 'default' : 'warning'}>
                  {event.status === 'upcoming' ? 'Sắp diễn ra' : 'Đang diễn ra'}
                </Badge>
                {reviews.filter(r => r.eventId === event.id).length > 0 && (
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                    {(reviews.filter(r => r.eventId === event.id).reduce((acc, curr) => acc + curr.rating, 0) / reviews.filter(r => r.eventId === event.id).length).toFixed(1)}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">{event.title}</h1>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed">{event.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Ngày tổ chức</p>
                    <p className="font-semibold text-slate-900">
                      {event.startDate && event.endDate && event.startDate !== event.endDate 
                        ? `${format(parseISO(event.startDate), 'dd/MM/yyyy')} - ${format(parseISO(event.endDate), 'dd/MM/yyyy')}`
                        : format(parseISO(event.date), 'EEEE, dd/MM/yyyy', { locale: vi })
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Thời gian</p>
                    <p className="font-semibold text-slate-900">{event.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:col-span-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Địa điểm</p>
                    <p className="font-semibold text-slate-900">{event.location}</p>
                    <p className="text-sm text-slate-600 mt-1">{event.address}</p>
                    {event.locationId && (
                      <Link 
                        to={`/events?locationId=${event.locationId}`}
                        className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 mt-2"
                      >
                        Xem tất cả sự kiện tại địa điểm này
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                    {userLocation && (
                      <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> Cách bạn {calculateDistance(userLocation.lat, userLocation.lng, event.lat, event.lng)} km
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Bản đồ</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Navigation className="w-4 h-4 mr-2" /> Chỉ đường
                </a>
              </Button>
            </CardHeader>
            <div className="h-64 bg-slate-200 relative flex items-center justify-center group cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`, '_blank')}>
              <div className="absolute inset-0 opacity-50 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=10.7769,106.7009&zoom=13&size=800x400&sensor=false')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col items-center p-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg group-hover:shadow-xl transition-all">
                <MapPin className="w-8 h-8 text-red-500 mb-2" />
                <p className="font-semibold text-slate-900 text-center">{event.location}</p>
                <p className="text-xs text-slate-500 text-center mt-1">Nhấn để xem trên Google Maps</p>
              </div>
            </div>
          </Card>

          {/* Reviews Section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Đánh giá & Bình luận</CardTitle>
              <CardDescription>Chia sẻ trải nghiệm của bạn về sự kiện này</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentUser && userRecord?.status === 'completed' && !reviews.some(r => r.userId === currentUser.id && r.eventId === event.id) && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Đánh giá của bạn</h4>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none mb-4"
                    rows={3}
                    placeholder="Chia sẻ cảm nghĩ của bạn về sự kiện (không bắt buộc)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                  <Button 
                    onClick={() => {
                      setIsSubmittingReview(true);
                      setTimeout(() => {
                        addReview({
                          userId: currentUser.id,
                          eventId: event.id,
                          rating,
                          comment
                        });
                        setIsSubmittingReview(false);
                      }, 500);
                    }}
                    disabled={isSubmittingReview}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {reviews.filter(r => r.eventId === event.id).length > 0 ? (
                  reviews.filter(r => r.eventId === event.id).sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    if (isNaN(dateA) && isNaN(dateB)) return 0;
                    if (isNaN(dateA)) return 1;
                    if (isNaN(dateB)) return -1;
                    return dateB - dateA;
                  }).map(review => {
                    const reviewer = users.find(u => u.id === review.userId);
                    return (
                      <div key={review.id} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <img src={reviewer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`} alt="Avatar" className="w-10 h-10 rounded-full bg-slate-100" />
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{reviewer?.name || 'Người dùng ẩn danh'}</p>
                              <p className="text-xs text-slate-500">{isValid(parseISO(review.date)) ? format(parseISO(review.date), 'dd/MM/yyyy HH:mm') : 'Chưa cập nhật'}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-slate-600 text-sm mt-3 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Star className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p>Chưa có đánh giá nào cho sự kiện này.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-md border-red-100 sticky top-6">
            <CardHeader className="bg-red-50/50 border-b border-red-100 pb-4">
              <CardTitle className="text-lg">Đăng ký tham gia</CardTitle>
              <CardDescription>Hãy cùng chung tay cứu người</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">Đã đăng ký</span>
                </div>
                <span className="font-bold text-slate-900 text-lg">{event.registered} <span className="text-sm font-normal text-slate-500">/ {event.target}</span></span>
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

              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-600 mb-4">
                  <strong className="text-slate-900">Đơn vị tổ chức:</strong><br />
                  {event.organizer}
                </p>

                {currentUser?.role !== 'admin' && !canDonate && !hasRegistered && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Chưa đủ điều kiện hiến máu</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Bạn cần chờ thêm <strong>{daysRemaining} ngày</strong> để đủ điều kiện hiến máu tiếp theo (ngày dự kiến: {!isNaN(nextDonationDate.getTime()) ? format(nextDonationDate, 'dd/MM/yyyy') : 'Chưa cập nhật'}).
                      </p>
                    </div>
                  </div>
                )}
                
                {currentUser?.role === 'admin' ? (
                  <Button 
                    className="w-full text-base py-6 shadow-md hover:shadow-lg transition-all bg-indigo-600 hover:bg-indigo-700 text-white font-bold" 
                    onClick={() => setShowScanner(true)}
                  >
                    <Heart className="w-5 h-5 mr-2" /> Quét mã QR Check-in
                  </Button>
                ) : hasRegistered && userRecord ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-900">Bạn đã đăng ký tham gia sự kiện</p>
                          <p className="text-[10px] text-emerald-600 font-medium">Lượng máu dự kiến: {userRecord.expectedAmount || 250}ml</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant={userRecord.status === 'completed' ? 'success' : userRecord.status === 'checked-in' ? 'default' : 'warning'} className="text-xs px-3 py-1">
                          {userRecord.status === 'completed' ? 'Đã hoàn thành' : userRecord.status === 'checked-in' ? 'Đã check-in' : 'Đã đăng ký'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">#{userRecord.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                    
                    {(userRecord.status === 'registered' || userRecord.status === 'checked-in') && (
                      <div className="space-y-6">
                        {userRecord.status === 'registered' && (
                          <div className="flex flex-col items-center p-6 bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 animate-gradient-x"></div>
                            <p className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-[0.3em]">Mã QR Check-in</p>
                            <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-500 ease-out">
                              <QRCode value={`checkin:${userRecord.id}`} size={180} />
                            </div>
                            <div className="mt-5 flex flex-col items-center gap-1">
                              <div className="px-5 py-2 bg-slate-50 rounded-full border border-slate-100 shadow-sm">
                                <p className="text-base font-mono font-bold text-slate-700 tracking-[0.4em]">{userRecord.id.substring(0, 8).toUpperCase()}</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-5 text-center leading-relaxed">
                              Xuất trình mã này cho nhân viên y tế<br/>tại điểm hiến máu để check-in nhanh chóng
                            </p>
                          </div>
                        )}

                        {/* Points and Rewards Section */}
                        <div className="space-y-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-bold text-slate-600 uppercase">Điểm thưởng dự kiến</span>
                              </div>
                              <span className="text-sm font-bold text-amber-600">+100 Điểm</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <motion.div 
                                className="h-full bg-amber-500"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">Điểm sẽ được cộng sau khi hoàn thành hiến máu</p>
                          </div>

                          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                            <div className="flex items-center gap-2 mb-3">
                              <Trophy className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs font-bold text-indigo-900 uppercase">Huy hiệu có thể đạt được</span>
                            </div>
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-indigo-100">
                                  <Award className="w-6 h-6 text-indigo-500" />
                                </div>
                                <span className="text-[9px] font-medium text-indigo-700">Người hùng</span>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-indigo-100">
                                  <Heart className="w-6 h-6 text-red-500" />
                                </div>
                                <span className="text-[9px] font-medium text-indigo-700">Trái tim hồng</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          <Button 
                            variant="outline"
                            className="w-full py-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-between px-6"
                            onClick={() => setShowInstructions(true)}
                          >
                            <div className="flex items-center gap-3">
                              <BookOpen className="w-5 h-5 text-indigo-500" />
                              <span className="font-bold">Xem hướng dẫn hiến máu</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </Button>

                          {userRecord.status === 'checked-in' && (
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 font-bold shadow-lg shadow-emerald-100 rounded-xl" onClick={() => completeDonation(userRecord.id, userRecord.expectedAmount || 350, currentUser?.bloodGroup || 'O+')}>
                              Xác nhận hoàn thành hiến máu
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            className="w-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors text-xs py-4" 
                            onClick={() => setIsConfirmModalOpen(true)}
                          >
                            Hủy đăng ký tham gia
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : event.registered >= event.target ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                      <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-600">Sự kiện đã đủ số lượng</p>
                    <p className="text-xs text-slate-400">Rất tiếc, sự kiện này đã nhận đủ số người đăng ký. Hẹn gặp bạn ở sự kiện tiếp theo!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl mb-2">
                      <p className="text-xs text-red-800 leading-relaxed font-medium">
                        <span className="font-bold">Lưu ý:</span> Bạn sẽ trải qua 7 câu hỏi sàng lọc sức khỏe nhanh trước khi hoàn tất đăng ký.
                      </p>
                    </div>
                    <Button 
                      className="w-full text-lg py-7 shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/50 transition-all bg-red-600 hover:bg-red-700 text-white font-bold group relative overflow-hidden hover:scale-[1.02] active:scale-[0.98]" 
                      onClick={handleStartRegistration}
                      disabled={isRegistering || event.status === 'completed' || !canDonate}
                    >
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <Heart className="w-7 h-7 mr-3 fill-current animate-pulse" /> 
                      {isRegistering ? 'Đang xử lý...' : 'Đăng ký hiến máu ngay'}
                    </Button>
                  </div>
                )}
                
                {currentUser?.role !== 'admin' && !hasRegistered && canDonate && (
                  <p className="text-xs text-center text-slate-500 mt-3 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Bạn sẽ cần trả lời câu hỏi sàng lọc sức khỏe
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          if (userRecord) {
            cancelRegistration(userRecord.id);
            toast.success(`Đã hủy đăng ký sự kiện "${event.title}"`);
            setShowSuccess(false);
          }
        }}
        title="Xác nhận hủy đăng ký"
        description={`Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện "${event.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận hủy"
        cancelText="Quay lại"
        variant="danger"
      />

      {/* Screening Modal */}
      <AnimatePresence>
        {showScreening && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl"
            >
              <Card className="shadow-2xl border-none overflow-hidden bg-white">
                {!showReview && !screeningFailed && (
                  <div className="h-3 bg-slate-100 w-full relative">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / SCREENING_QUESTIONS.length) * 100}%` }}
                      transition={{ type: "spring", stiffness: 50, damping: 15 }}
                    />
                    <div className="absolute top-0 right-4 h-full flex items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {Math.round(((currentStep + 1) / SCREENING_QUESTIONS.length) * 100)}%
                      </span>
                    </div>
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    {!showReview && !screeningFailed && (
                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                        Câu hỏi {currentStep + 1} / {SCREENING_QUESTIONS.length}
                      </Badge>
                    )}
                    {showReview && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                        Kiểm tra lại thông tin
                      </Badge>
                    )}
                    {screeningFailed && (
                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                        Kết quả sàng lọc
                      </Badge>
                    )}
                    <button 
                      onClick={() => setShowScreening(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {showReview ? 'Xác nhận thông tin' : screeningFailed ? 'Thông báo quan trọng' : 'Sàng lọc sức khỏe'}
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    {showReview 
                      ? 'Vui lòng kiểm tra kỹ các câu trả lời của bạn trước khi đăng ký.' 
                      : screeningFailed 
                        ? 'Rất tiếc, bạn chưa đủ điều kiện hiến máu lần này.' 
                        : 'Câu trả lời của bạn giúp chúng tôi đảm bảo an toàn cho cả người hiến và người nhận.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2 pb-8 max-h-[60vh] overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {screeningFailed ? (
                      <motion.div 
                        key="failed"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 py-4"
                      >
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                          <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <div className="text-center space-y-2">
                          <h3 className="text-xl font-bold text-slate-900">Không đủ điều kiện hiến máu</h3>
                          <p className="text-slate-600 leading-relaxed">
                            Dựa trên câu trả lời cho câu hỏi: <span className="font-semibold text-red-600">"{failedQuestion}"</span>, bạn hiện chưa đủ điều kiện để hiến máu trong thời gian này nhằm đảm bảo an toàn sức khỏe.
                          </p>
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
                          <p className="font-semibold flex items-center gap-2 mb-1">
                            <Info className="w-4 h-4" /> Lời khuyên cho bạn:
                          </p>
                          <p>Hãy nghỉ ngơi, ăn uống đầy đủ và quay lại khi sức khỏe đã ổn định hoặc sau thời gian quy định. Cảm ơn tấm lòng vàng của bạn!</p>
                        </div>
                      </motion.div>
                    ) : showReview ? (
                      <motion.div
                        key="review"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 py-4"
                      >
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                          <div className="flex items-center gap-3 text-emerald-800">
                            <CheckCircle2 className="w-5 h-5" />
                            <p className="font-semibold">Tuyệt vời! Bạn có vẻ đủ điều kiện hiến máu.</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {SCREENING_QUESTIONS.map((q) => (
                            <div key={q.id} className="flex items-start justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                              <div className="flex-1 pr-4">
                                <p className="text-sm font-medium text-slate-700">{q.text}</p>
                              </div>
                              <Badge variant={answers[q.id] === q.expected ? 'success' : 'warning'} className="shrink-0">
                                {answers[q.id] ? 'CÓ' : 'KHÔNG'}
                              </Badge>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Droplet className="w-5 h-5 text-red-500" />
                              <h4 className="font-bold text-slate-900">Chọn lượng máu dự kiến hiến</h4>
                            </div>
                            <div className="relative">
                              <select 
                                value={expectedAmount}
                                onChange={(e) => setExpectedAmount(Number(e.target.value))}
                                className="appearance-none bg-slate-100 border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                              >
                                <option value={250}>250 ml</option>
                                <option value={350}>350 ml</option>
                                <option value={450}>450 ml</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { amount: 250, label: 'Phổ biến', desc: 'Dành cho người hiến lần đầu hoặc cân nặng nhẹ.' },
                              { amount: 350, label: 'Khuyên dùng', desc: 'Lượng máu tiêu chuẩn, phù hợp với đa số mọi người.' },
                              { amount: 450, label: 'Tối đa', desc: 'Dành cho người có thể trạng tốt và hiến thường xuyên.' }
                            ].map((item) => (
                              <button
                                key={item.amount}
                                onClick={() => setExpectedAmount(item.amount)}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                                  expectedAmount === item.amount
                                    ? 'border-red-500 bg-red-50 ring-4 ring-red-500/5 shadow-sm'
                                    : 'border-slate-100 bg-white hover:border-red-200'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                                    expectedAmount === item.amount ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {item.amount}
                                  </div>
                                  <div>
                                    <p className={`font-bold transition-colors ${expectedAmount === item.amount ? 'text-red-900' : 'text-slate-700'}`}>
                                      {item.amount} ml
                                      <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                                        expectedAmount === item.amount ? 'bg-red-200 text-red-700' : 'bg-slate-200 text-slate-500'
                                      }`}>
                                        {item.label}
                                      </span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                  </div>
                                </div>
                                {expectedAmount === item.amount && (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <CheckCircle2 className="w-5 h-5 text-red-500" />
                                  </motion.div>
                                )}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                            * Lưu ý: Lượng máu thực tế sẽ được bác sĩ chỉ định dựa trên kết quả khám lâm sàng và xét nghiệm máu tại chỗ.
                          </p>
                        </div>
                        
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-xs mt-6">
                          <p className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Bằng việc nhấn "Hoàn tất & Đăng ký", bạn cam đoan các thông tin trên là hoàn toàn trung thực. Thông tin sai lệch có thể gây nguy hiểm cho người nhận máu.</span>
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8 py-4"
                      >
                        <div className="space-y-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                              SCREENING_QUESTIONS[currentStep].isCritical ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
                            }`}>
                              {(SCREENING_QUESTIONS[currentStep] as any).icon}
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className={`text-xl font-bold leading-tight ${SCREENING_QUESTIONS[currentStep].isCritical ? 'text-red-900' : 'text-slate-900'}`}>
                                  {SCREENING_QUESTIONS[currentStep].text}
                                </h3>
                                {SCREENING_QUESTIONS[currentStep].isCritical && (
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none text-[10px] px-2 py-0">
                                    <AlertCircle className="w-3 h-3 mr-1" /> Quan trọng
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {SCREENING_QUESTIONS[currentStep].isCritical && (
                            <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-xs animate-pulse">
                              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                              <p className="font-medium">{SCREENING_QUESTIONS[currentStep].warningText}</p>
                            </div>
                          )}

                          <p className="text-slate-600 text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100 leading-relaxed relative">
                            <span className="absolute -top-3 left-4 px-2 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 rounded">Giải thích</span>
                            {SCREENING_QUESTIONS[currentStep].description}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => handleAnswer(SCREENING_QUESTIONS[currentStep].id, true)}
                            className={`group relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all duration-300 ${
                              answers[SCREENING_QUESTIONS[currentStep].id] === true 
                                ? 'border-emerald-500 bg-emerald-50 ring-8 ring-emerald-500/5 shadow-lg' 
                                : 'border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50/30'
                            }`}
                          >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                              answers[SCREENING_QUESTIONS[currentStep].id] === true ? 'bg-emerald-500 text-white scale-110' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-500'
                            }`}>
                              <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <span className={`font-black text-xl tracking-wider ${answers[SCREENING_QUESTIONS[currentStep].id] === true ? 'text-emerald-700' : 'text-slate-600'}`}>CÓ</span>
                            
                            {/* Radio indicator */}
                            <div className={`mt-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              answers[SCREENING_QUESTIONS[currentStep].id] === true ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200 bg-white'
                            }`}>
                              {answers[SCREENING_QUESTIONS[currentStep].id] === true && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>

                            <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${answers[SCREENING_QUESTIONS[currentStep].id] === true ? 'bg-emerald-500 animate-ping' : 'bg-transparent'}`}></div>
                          </button>

                          <button
                            onClick={() => handleAnswer(SCREENING_QUESTIONS[currentStep].id, false)}
                            className={`group relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all duration-300 ${
                              answers[SCREENING_QUESTIONS[currentStep].id] === false 
                                ? 'border-red-500 bg-red-50 ring-8 ring-red-500/5 shadow-lg' 
                                : 'border-slate-100 bg-white hover:border-red-200 hover:bg-red-50/30'
                            }`}
                          >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                              answers[SCREENING_QUESTIONS[currentStep].id] === false ? 'bg-red-500 text-white scale-110' : 'bg-slate-100 text-slate-400 group-hover:bg-red-100 group-hover:text-red-500'
                            }`}>
                              <XCircle className="w-8 h-8" />
                            </div>
                            <span className={`font-black text-xl tracking-wider ${answers[SCREENING_QUESTIONS[currentStep].id] === false ? 'text-red-700' : 'text-slate-600'}`}>KHÔNG</span>
                            
                            {/* Radio indicator */}
                            <div className={`mt-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              answers[SCREENING_QUESTIONS[currentStep].id] === false ? 'border-red-500 bg-red-500' : 'border-slate-200 bg-white'
                            }`}>
                              {answers[SCREENING_QUESTIONS[currentStep].id] === false && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>

                            <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${answers[SCREENING_QUESTIONS[currentStep].id] === false ? 'bg-red-500 animate-ping' : 'bg-transparent'}`}></div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>

                <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6 flex justify-between items-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      if (showReview) {
                        setShowReview(false);
                        setCurrentStep(SCREENING_QUESTIONS.length - 1);
                      } else if (currentStep > 0 && !screeningFailed) {
                        setCurrentStep(prev => prev - 1);
                      } else {
                        setShowScreening(false);
                      }
                    }}
                    className="text-slate-500"
                  >
                    {showReview || (currentStep > 0 && !screeningFailed) ? 'Quay lại' : 'Hủy bỏ'}
                  </Button>

                  {screeningFailed ? (
                    <Button onClick={() => setShowScreening(false)} className="bg-slate-900 hover:bg-slate-800 text-white px-8">
                      Đã hiểu
                    </Button>
                  ) : showReview ? (
                    <Button 
                      onClick={handleSubmitScreening} 
                      className="bg-red-600 hover:bg-red-700 text-white px-8 shadow-lg shadow-red-200 font-bold"
                    >
                      Hoàn tất & Đăng ký
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl border-none overflow-hidden text-center">
                <div className="h-2 bg-emerald-500 w-full" />
                <CardContent className="p-8 space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">Đăng ký thành công!</h3>
                    <p className="text-slate-500">
                      Cảm ơn bạn đã đăng ký tham gia hiến máu. Tấm lòng của bạn sẽ góp phần cứu sống nhiều người.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mã QR của bạn</p>
                    <div className="bg-white p-3 rounded-lg inline-block border border-slate-100 shadow-sm">
                      <QRCode value={`checkin:${userRecord?.id}`} size={160} />
                    </div>
                    <p className="text-sm font-mono font-bold text-slate-700">{userRecord?.id.substring(0, 8).toUpperCase()}</p>
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button 
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6"
                      onClick={() => setShowSuccess(false)}
                    >
                      Tuyệt vời, tôi đã hiểu
                    </Button>
                    <p className="text-[10px] text-slate-400">
                      Bạn có thể xem lại mã QR này bất cứ lúc nào trong trang chi tiết sự kiện.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg"
            >
              <Card className="shadow-2xl border-none overflow-hidden bg-white">
                <CardHeader className="bg-indigo-600 text-white pb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <button onClick={() => setShowInstructions(false)} className="text-white/60 hover:text-white transition-colors">
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <CardTitle className="text-2xl font-bold">Hướng dẫn hiến máu</CardTitle>
                  <CardDescription className="text-indigo-100">Những điều cần lưu ý để buổi hiến máu diễn ra an toàn</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold">1</div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Trước khi hiến máu</h4>
                        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                          <li>Ngủ đủ giấc (ít nhất 6 tiếng) vào đêm trước.</li>
                          <li>Ăn nhẹ, không ăn đồ nhiều dầu mỡ trước khi hiến.</li>
                          <li>Không uống rượu bia trong vòng 24h trước.</li>
                          <li>Uống nhiều nước (khoảng 500ml) trước khi hiến.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">2</div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Trong khi hiến máu</h4>
                        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                          <li>Giữ tâm lý thoải mái, hít thở đều.</li>
                          <li>Thông báo ngay cho nhân viên y tế nếu thấy chóng mặt, buồn nôn.</li>
                          <li>Thực hiện theo hướng dẫn của bác sĩ.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold">3</div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Sau khi hiến máu</h4>
                        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                          <li>Nghỉ ngơi tại chỗ ít nhất 15-30 phút.</li>
                          <li>Uống nhiều nước, ăn nhẹ (bánh, sữa) được cung cấp.</li>
                          <li>Tránh vận động mạnh, làm việc nặng trong ngày.</li>
                          <li>Giữ băng dán vết tiêm trong ít nhất 4-6 giờ.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <span className="font-bold">Lưu ý quan trọng:</span> Nếu sau khi hiến máu bạn thấy có bất kỳ triệu chứng bất thường nào, hãy liên hệ ngay với số hotline của đơn vị tổ chức hoặc cơ sở y tế gần nhất.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 p-4">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowInstructions(false)}>Tôi đã hiểu</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Admin Action Modal for Scanned User */}
      <AnimatePresence>
        {scannedRecordId && scannedRecord && scannedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl border-none overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-900">Thông tin người hiến</CardTitle>
                    <button onClick={() => setScannedRecordId(null)} className="text-slate-400 hover:text-slate-600">
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                      <img src={scannedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${scannedUser.name}`} alt={scannedUser.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{scannedUser.name}</h4>
                      <p className="text-slate-500 text-sm">{scannedUser.email}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100">Nhóm máu: {scannedUser.bloodGroup || 'Chưa rõ'}</Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100">{scannedUser.donationsCount} lần hiến</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Trạng thái hiện tại:</span>
                      <Badge variant={scannedRecord.status === 'completed' ? 'success' : scannedRecord.status === 'checked-in' ? 'default' : 'warning'}>
                        {scannedRecord.status === 'completed' ? 'Đã hoàn thành' : scannedRecord.status === 'checked-in' ? 'Đã check-in' : 'Đã đăng ký'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Mã đăng ký:</span>
                      <span className="font-mono font-bold text-slate-700">{scannedRecord.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                  </div>

                  {scannedRecord.status === 'registered' && (
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg font-bold shadow-lg shadow-indigo-100"
                      onClick={() => {
                        checkInUser(scannedRecord.id);
                        alert('Check-in thành công!');
                      }}
                    >
                      Xác nhận Check-in
                    </Button>
                  )}

                  {scannedRecord.status === 'checked-in' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Lượng máu hiến (ml)</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[250, 350, 450].map(amt => (
                            <Button 
                              key={amt}
                              type="button"
                              variant={donationAmount === amt ? 'default' : 'outline'}
                              className={donationAmount === amt ? 'bg-red-600 hover:bg-red-700' : ''}
                              onClick={() => setDonationAmount(amt)}
                            >
                              {amt}ml
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-bold shadow-lg shadow-emerald-100"
                        onClick={() => {
                          completeDonation(scannedRecord.id, donationAmount, scannedUser.bloodGroup || 'O+');
                          setScannedRecordId(null);
                          alert('Đã ghi nhận kết quả hiến máu thành công!');
                        }}
                      >
                        Xác nhận hiến thành công
                      </Button>
                    </div>
                  )}

                  {scannedRecord.status === 'completed' && (
                    <div className="text-center py-4 space-y-2">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="font-bold text-emerald-700">Người này đã hoàn thành hiến máu</p>
                      <p className="text-slate-500 text-sm">Lượng máu: {scannedRecord.amount}ml - Nhóm máu: {scannedRecord.bloodGroup}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 p-4">
                  <Button variant="ghost" className="w-full text-slate-500" onClick={() => setScannedRecordId(null)}>Đóng</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};