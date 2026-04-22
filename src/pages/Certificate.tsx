import React, { useRef, useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Award, Download, Share2, Heart, ShieldCheck, Loader2, Calendar, MapPin, Building2, Droplets, Eye, ArrowLeft, FileText, Image as ImageIcon, Filter, Search, History as HistoryIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

const THEMES = [
  {
    id: 'red',
    border: 'border-red-100',
    corner: 'border-red-300',
    iconBg: 'bg-red-50',
    iconBorder: 'border-red-100',
    iconText: 'text-red-600',
    textPrimary: 'text-red-600',
    shield: 'text-red-700',
  },
  {
    id: 'blue',
    border: 'border-blue-100',
    corner: 'border-blue-300',
    iconBg: 'bg-blue-50',
    iconBorder: 'border-blue-100',
    iconText: 'text-blue-600',
    textPrimary: 'text-blue-600',
    shield: 'text-blue-700',
  },
  {
    id: 'emerald',
    border: 'border-emerald-100',
    corner: 'border-emerald-300',
    iconBg: 'bg-emerald-50',
    iconBorder: 'border-emerald-100',
    iconText: 'text-emerald-600',
    textPrimary: 'text-emerald-600',
    shield: 'text-emerald-700',
  },
  {
    id: 'violet',
    border: 'border-violet-100',
    corner: 'border-violet-300',
    iconBg: 'bg-violet-50',
    iconBorder: 'border-violet-100',
    iconText: 'text-violet-600',
    textPrimary: 'text-violet-600',
    shield: 'text-violet-700',
  },
  {
    id: 'amber',
    border: 'border-amber-100',
    corner: 'border-amber-300',
    iconBg: 'bg-amber-50',
    iconBorder: 'border-amber-100',
    iconText: 'text-amber-600',
    textPrimary: 'text-amber-600',
    shield: 'text-amber-700',
  },
  {
    id: 'rose',
    border: 'border-rose-100',
    corner: 'border-rose-300',
    iconBg: 'bg-rose-50',
    iconBorder: 'border-rose-100',
    iconText: 'text-rose-600',
    textPrimary: 'text-rose-600',
    shield: 'text-rose-700',
  }
];

const getThemeForEvent = (eventId: string) => {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % THEMES.length;
  return THEMES[index];
};

interface CertificateProps {
  initialRecordId?: string;
}

export const Certificate: React.FC<CertificateProps> = ({ initialRecordId }) => {
  const { currentUser, records, events } = useApp();
  const certificateRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'cv'>(initialRecordId ? 'detail' : 'list');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(initialRecordId || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImageName, setGeneratedImageName] = useState<string>('');

  const completedRecords = useMemo(() => {
    if (!currentUser) return [];
    return records.filter(r => r.userId === currentUser.id && r.status === 'completed')
                  .sort((a, b) => {
                    const timeA = new Date(a.date).getTime();
                    const timeB = new Date(b.date).getTime();
                    if (isNaN(timeA) && isNaN(timeB)) return 0;
                    if (isNaN(timeA)) return 1;
                    if (isNaN(timeB)) return -1;
                    return timeB - timeA;
                  });
  }, [currentUser, records]);

  // Extract unique years and events for filters
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    completedRecords.forEach(r => {
      if (isValid(parseISO(r.date))) {
        years.add(format(parseISO(r.date), 'yyyy'));
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [completedRecords]);

  const availableEvents = useMemo(() => {
    const eventIds = new Set<string>();
    completedRecords.forEach(r => eventIds.add(r.eventId));
    return Array.from(eventIds).map(id => events.find(e => e.id === id)).filter(Boolean) as typeof events;
  }, [completedRecords, events]);

  const filteredRecords = useMemo(() => {
    return completedRecords.filter(record => {
      const recordYear = format(parseISO(record.date), 'yyyy');
      if (yearFilter !== 'all' && recordYear !== yearFilter) return false;
      if (eventFilter !== 'all' && record.eventId !== eventFilter) return false;
      return true;
    });
  }, [completedRecords, yearFilter, eventFilter]);

  const selectedRecord = useMemo(() => {
    return completedRecords.find(r => r.id === selectedRecordId) || completedRecords[0];
  }, [completedRecords, selectedRecordId]);

  const selectedEvent = useMemo(() => {
    return selectedRecord ? events.find(e => e.id === selectedRecord.eventId) : null;
  }, [selectedRecord, events]);

  const currentTheme = useMemo(() => {
    return selectedEvent ? getThemeForEvent(selectedEvent.id) : THEMES[0];
  }, [selectedEvent]);

  if (!currentUser) return null;

  const generateImage = async (ref: React.RefObject<HTMLDivElement>, isStory: boolean = false) => {
    if (!ref.current) return null;
    try {
      // Ensure all images are loaded before generating
      const images = ref.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Use html2canvas as it's often more reliable for complex layouts with external fonts
      const canvas = await html2canvas(ref.current, {
        scale: isStory ? 2 : 1.2, // Slightly lower scale for better compatibility
        useCORS: true,
        allowTaint: false, // Changed to false to prevent tainted canvas issues
        backgroundColor: '#ffffff',
        logging: true, // Enable logging for debugging if needed
        width: ref.current.offsetWidth,
        height: ref.current.offsetHeight,
      });
      
      return canvas.toDataURL('image/png', 0.9);
    } catch (error) {
      console.error('Error generating image with html2canvas:', error);
      
      // Fallback to html-to-image if html2canvas fails
      try {
        const dataUrl = await toPng(ref.current, {
          quality: 0.9,
          pixelRatio: isStory ? 2 : 1.2,
          backgroundColor: '#ffffff',
        });
        return dataUrl;
      } catch (fallbackError) {
        console.error('Fallback generation failed:', fallbackError);
        toast.error('Không thể tạo ảnh. Vui lòng thử lại hoặc chụp màn hình.');
        return null;
      }
    }
  };

  const handleDownload = async (recordId: string, isStory: boolean = false) => {
    setSelectedRecordId(recordId);
    // Need to wait for state to update and DOM to render if we were in list view
    if (viewMode === 'list') {
      setViewMode('detail');
      // Wait a bit for the DOM to update
      setTimeout(() => performDownload(isStory), 100);
    } else {
      performDownload(isStory);
    }
  };

  const performDownload = async (isStory: boolean) => {
    setIsGenerating(true);
    toast.info(isStory ? 'Đang tạo ảnh story...' : 'Đang tải chứng nhận...');
    
    const dataUrl = await generateImage(certificateRef, isStory);
    if (dataUrl) {
      const fileName = isStory ? `story-hien-mau-${selectedRecord?.id}.png` : `chung-nhan-${selectedRecord?.id}.png`;
      setGeneratedImageUrl(dataUrl);
      setGeneratedImageName(fileName);
      toast.success('Đã tạo ảnh thành công');
    } else {
      toast.error('Có lỗi xảy ra khi tạo ảnh');
    }
    setIsGenerating(false);
  };

  const handleShare = async (recordId: string) => {
    setSelectedRecordId(recordId);
    if (viewMode === 'list') {
      setViewMode('detail');
      setTimeout(() => performShare(), 100);
    } else {
      performShare();
    }
  };

  const performShare = async () => {
    if (!selectedRecord || !selectedEvent) return;
    
    setIsGenerating(true);
    toast.info('Đang chuẩn bị ảnh để chia sẻ...');
    
    const dataUrl = await generateImage(certificateRef);
    setIsGenerating(false);

    if (!dataUrl) {
      toast.error('Có lỗi xảy ra khi tạo ảnh');
      return;
    }

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `chung-nhan-${selectedRecord.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Chứng nhận hiến máu tình nguyện',
          text: `Tôi vừa hiến máu tình nguyện tại sự kiện ${selectedEvent.title}. Hãy cùng chung tay vì cộng đồng!`,
          files: [file]
        });
        toast.success('Đã chia sẻ thành công');
      } else {
        // Fallback for Facebook/Zalo sharing if Web Share API is not supported
        // In a real app, you would upload the image to a server and share the URL
        const shareUrl = window.location.href;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Đã sao chép liên kết. Bạn có thể dán vào Facebook/Zalo.');
      }
    } catch (error) {
      console.error('Share failed:', error);
      if ((error as Error).name !== 'AbortError') {
        toast.error('Không thể chia sẻ lúc này');
      }
    }
  };

  const handleDownloadCV = async () => {
    setViewMode('cv');
    setTimeout(async () => {
      setIsGenerating(true);
      toast.info('Đang tạo CV thiện nguyện...');
      const dataUrl = await generateImage(cvRef);
      if (dataUrl) {
        setGeneratedImageUrl(dataUrl);
        setGeneratedImageName(`cv-thien-nguyen-${currentUser.name}.png`);
        toast.success('Đã tạo CV thiện nguyện thành công');
      } else {
        toast.error('Có lỗi xảy ra khi tạo CV');
      }
      setIsGenerating(false);
      setViewMode('list');
    }, 100);
  };

  const verificationUrl = `${window.location.origin}/verify/${selectedRecord?.id}`;

  const renderListView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center shrink-0 border-2 border-red-100">
            <Award className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chứng nhận hiến máu</h1>
            <p className="text-slate-500">Tôn vinh nghĩa cử cao đẹp của bạn.</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng số chứng nhận</p>
          <p className="text-4xl font-black text-red-600">{completedRecords.length}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-700 font-medium shrink-0">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="hidden sm:inline">Bộ lọc:</span>
          </div>
          <select 
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 outline-none"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">Tất cả các năm</option>
            {availableYears.map(year => (
              <option key={year} value={year}>Năm {year}</option>
            ))}
          </select>
          <select 
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 outline-none"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="all">Tất cả sự kiện</option>
            {availableEvents.map(event => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
        </div>
        <Button onClick={handleDownloadCV} className="w-full md:w-auto gap-2 bg-slate-800 hover:bg-slate-900 text-white">
          <FileText className="w-4 h-4" />
          Tạo CV Thiện Nguyện
        </Button>
      </div>

      {/* Certificate List */}
      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map(record => {
            const event = events.find(e => e.id === record.eventId);
            if (!event) return null;
            const theme = getThemeForEvent(event.id);
            const verificationUrl = `${window.location.origin}/verify/${record.id}`;
            const qrValue = JSON.stringify({ id: record.id, url: verificationUrl });

            return (
              <Card key={record.id} className={`overflow-hidden shadow-sm transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border-t-4 ${theme.border} group`}>
                <CardHeader className="pb-3 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 rounded-lg ${theme.iconBg}`}>
                      <Award className={`w-5 h-5 ${theme.iconText}`} />
                    </div>
                    <div className="bg-white p-1 rounded border border-slate-100 shadow-sm">
                      <div className="bg-white p-1 rounded shadow-sm">
                        <QRCode value={qrValue} size={40} />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight line-clamp-2" title={event.title}>{event.title}</CardTitle>
                  <CardDescription className="font-mono text-xs mt-1">ID: {record.id.substring(0, 8).toUpperCase()}</CardDescription>
                </CardHeader>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{format(parseISO(record.date), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1" title={event.location}>{event.location}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1" title={event.organizer}>{event.organizer}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900 pt-2 border-t border-slate-100">
                    <Droplets className="w-4 h-4 text-red-500 shrink-0" />
                    <span>Đã hiến: {record.amount} ml</span>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 p-3 grid grid-cols-3 gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex flex-col items-center gap-1 h-auto py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => { setSelectedRecordId(record.id); setViewMode('detail'); }}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Chi tiết</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex flex-col items-center gap-1 h-auto py-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                    onClick={() => handleDownload(record.id)}
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Tải PDF</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex flex-col items-center gap-1 h-auto py-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50"
                    onClick={() => handleShare(record.id)}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Chia sẻ</span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy chứng nhận</h2>
          <p className="text-slate-500 max-w-md mx-auto">Không có chứng nhận nào khớp với bộ lọc hiện tại của bạn.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setYearFilter('all'); setEventFilter('all'); }}>
            Xóa bộ lọc
          </Button>
        </div>
      )}
    </div>
  );

  const ListView = ({ 
    records, 
    events, 
    onSelect, 
    onDownload, 
    onShare,
    setYearFilter,
    setEventFilter,
    yearFilter,
    eventFilter,
    availableYears,
    availableEvents
  }: { 
    records: any[], 
    events: any[], 
    onSelect: (id: string) => void,
    onDownload: (id: string) => void,
    onShare: (id: string) => void,
    setYearFilter: (year: string) => void,
    setEventFilter: (event: string) => void,
    yearFilter: string,
    eventFilter: string,
    availableYears: string[],
    availableEvents: any[]
  }) => {
    return (
      <div className="space-y-8">
        {/* Stats Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-red-50 rounded-2xl">
              <Award className="w-10 h-10 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Chứng nhận của tôi</h1>
              <p className="text-slate-500 font-medium">Lưu giữ những khoảnh khắc thiện nguyện ý nghĩa</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tổng số chứng nhận</p>
            <p className="text-4xl font-black text-red-600">{records.length}</p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-slate-700 font-medium shrink-0">
              <Filter className="w-5 h-5 text-slate-400" />
              <span className="hidden sm:inline">Bộ lọc:</span>
            </div>
            <select 
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 outline-none"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">Tất cả các năm</option>
              {availableYears.map(year => (
                <option key={year} value={year}>Năm {year}</option>
              ))}
            </select>
            <select 
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 outline-none"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="all">Tất cả sự kiện</option>
              {availableEvents.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>
        </div>

        {records.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map(record => {
              const event = events.find(e => e.id === record.eventId);
              if (!event) return null;
              const theme = getThemeForEvent(event.id);
              const verificationUrl = `${window.location.origin}/verify/${record.id}`;
              const qrValue = JSON.stringify({ id: record.id, url: verificationUrl });

              return (
                <Card key={record.id} className={`overflow-hidden shadow-sm transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl border-t-4 ${theme.border} group`}>
                  <CardHeader className="pb-3 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <div className={`p-2 rounded-lg ${theme.iconBg}`}>
                        <Award className={`w-5 h-5 ${theme.iconText}`} />
                      </div>
                      <div className="bg-white p-1 rounded border border-slate-100 shadow-sm">
                        <div className="bg-white p-1 rounded shadow-sm">
                          <QRCode value={qrValue} size={40} />
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight line-clamp-2" title={event.title}>{event.title}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">ID: {record.id.substring(0, 8).toUpperCase()}</CardDescription>
                  </CardHeader>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{format(parseISO(record.date), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1" title={event.location}>{event.location}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1" title={event.organizer}>{event.organizer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900 pt-2 border-t border-slate-100">
                      <Droplets className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Đã hiến: {record.amount} ml</span>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t border-slate-100 p-3 grid grid-cols-3 gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex flex-col items-center gap-1 h-auto py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                      onClick={() => onSelect(record.id)}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold">Chi tiết</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex flex-col items-center gap-1 h-auto py-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                      onClick={() => onDownload(record.id)}
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold">Tải PDF</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex flex-col items-center gap-1 h-auto py-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50"
                      onClick={() => onShare(record.id)}
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold">Chia sẻ</span>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy chứng nhận</h2>
            <p className="text-slate-500 max-w-md mx-auto">Không có chứng nhận nào khớp với bộ lọc hiện tại của bạn.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setYearFilter('all'); setEventFilter('all'); }}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>
    );
  };

  const DetailView = ({ 
    record, 
    event, 
    theme, 
    currentUser, 
    onBack, 
    onDownload, 
    onShare, 
    isGenerating,
    certificateRef 
  }: { 
    record: any, 
    event: any, 
    theme: any, 
    currentUser: any,
    onBack: () => void,
    onDownload: (id: string, story?: boolean) => void,
    onShare: (id: string) => void,
    isGenerating: boolean,
    certificateRef: React.RefObject<HTMLDivElement | null>
  }) => {
    const verificationUrl = `${window.location.origin}/verify/${record.id}`;

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Detail Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-4 z-20">
          <Button variant="ghost" onClick={onBack} className="gap-2 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => onDownload(record.id, true)} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />} 
              Tạo Ảnh Story
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => onShare(record.id)} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} 
              Chia sẻ
            </Button>
            <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white" onClick={() => onDownload(record.id)} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
              Tải Chứng Nhận
            </Button>
          </div>
        </div>

        {/* Certificate Container */}
        <div className="relative p-4 md:p-8 bg-slate-100 rounded-2xl shadow-inner border border-slate-200 overflow-x-auto flex justify-center">
          <div 
            ref={certificateRef}
            className={`w-[800px] md:w-[900px] shrink-0 bg-white p-12 relative shadow-2xl border-[16px] border-double ${theme.border} overflow-hidden`}
            style={{ aspectRatio: '1.414/1' }} // A4 landscape ratio
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ 
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
              backgroundSize: '20px 20px' 
            }}></div>
            
            {/* Corner Ornaments */}
            <div className={`absolute top-8 left-8 w-32 h-32 border-t-[6px] border-l-[6px] ${theme.corner} opacity-80`}></div>
            <div className={`absolute top-8 right-8 w-32 h-32 border-t-[6px] border-r-[6px] ${theme.corner} opacity-80`}></div>
            <div className={`absolute bottom-8 left-8 w-32 h-32 border-b-[6px] border-l-[6px] ${theme.corner} opacity-80`}></div>
            <div className={`absolute bottom-8 right-8 w-32 h-32 border-b-[6px] border-r-[6px] ${theme.corner} opacity-80`}></div>

            {/* Inner Border */}
            <div className={`absolute inset-10 border-2 border-dashed ${theme.corner} opacity-40 pointer-events-none`}></div>

            <div className="relative z-10 flex flex-col items-center text-center h-full justify-between">
              {/* Header */}
              <div className="space-y-6 w-full">
                <div className="flex justify-between items-start w-full px-12">
                  <div className="w-24 h-24 flex items-center justify-center">
                     <ShieldCheck className={`w-16 h-16 ${theme.shield} opacity-20`} />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`w-24 h-24 rounded-full ${theme.iconBg} flex items-center justify-center border-4 ${theme.iconBorder} shadow-sm mb-4 overflow-hidden`}>
                      {event.imageUrl ? (
                        <img 
                          src={event.imageUrl || undefined} 
                          alt="Logo" 
                          className="w-full h-full object-cover" 
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <Heart className={`w-12 h-12 ${theme.iconText} fill-current`} />
                      )}
                    </div>
                    <h2 className={`text-sm font-bold uppercase tracking-[0.25em] ${theme.textPrimary}`}>Ban chỉ đạo vận động hiến máu tình nguyện</h2>
                  </div>
                  <div className="w-24 h-24 flex items-center justify-center">
                     <Award className={`w-16 h-16 ${theme.shield} opacity-20`} />
                  </div>
                </div>
                
                <div className="relative inline-block mt-6">
                  <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                    GIẤY CHỨNG NHẬN
                  </h1>
                  <h2 className="text-2xl md:text-3xl font-serif font-semibold text-slate-700 mt-3 tracking-[0.15em]" style={{ fontFamily: '"Playfair Display", serif' }}>
                    HIẾN MÁU TÌNH NGUYỆN
                  </h2>
                  <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-transparent via-${theme.id}-400 to-transparent`}></div>
                </div>
              </div>

              {/* Body */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-8 w-full max-w-4xl mx-auto mt-10 text-left">
                {/* Section 1: Donor Info */}
                <div className="space-y-3">
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.textPrimary} border-b border-slate-100 pb-1`}>Thông tin người hiến</h3>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-slate-900 uppercase">{currentUser.name}</p>
                    <p className="text-sm text-slate-600">Ngày sinh: <span className="font-semibold text-slate-900">{currentUser.birthDate ? format(parseISO(currentUser.birthDate), 'dd/MM/yyyy') : '01/01/1990'}</span></p>
                    <p className="text-sm text-slate-600">Nhóm máu: <span className={`font-bold text-lg ${theme.textPrimary}`}>{record.bloodGroup}</span></p>
                  </div>
                </div>

                {/* Section 2: Donation Info */}
                <div className="space-y-3">
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.textPrimary} border-b border-slate-100 pb-1`}>Thông tin lần hiến máu</h3>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-slate-900">{event.title}</p>
                    <p className="text-sm text-slate-600">Ngày hiến: <span className="font-semibold text-slate-900">{format(parseISO(record.date), 'dd/MM/yyyy')}</span></p>
                    <p className="text-sm text-slate-600">Lượng máu: <span className="font-bold text-slate-900 text-lg">{record.amount} ml</span></p>
                  </div>
                </div>

                {/* Section 3: Facility Info */}
                <div className="space-y-3">
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.textPrimary} border-b border-slate-100 pb-1`}>Thông tin cơ sở y tế</h3>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{event.organizer}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{event.address || event.location}</p>
                  </div>
                </div>

                {/* Section 4: Donor Benefits */}
                <div className="space-y-3">
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${theme.textPrimary} border-b border-slate-100 pb-1`}>Quyền lợi người hiến</h3>
                  <ul className="text-[10px] text-slate-500 space-y-0.5 list-disc pl-4 italic">
                    <li>Được bồi hoàn máu tối đa bằng lượng máu đã hiến.</li>
                    <li>Được cấp giấy chứng nhận hiến máu tình nguyện.</li>
                    <li>Được xét nghiệm sàng lọc các bệnh truyền nhiễm.</li>
                    <li>Được hỗ trợ chi phí đi lại và phục hồi sức khỏe.</li>
                  </ul>
                </div>
              </div>

              {/* Body Text Summary */}
              <div className="w-full max-w-3xl mx-auto mt-6">
                <p className="text-sm text-slate-600 italic font-serif text-center" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                  Nghĩa cử cao đẹp của bạn đã góp phần mang lại sự sống cho những người bệnh đang cần truyền máu. 
                  Ban chỉ đạo vận động hiến máu tình nguyện trân trọng cảm ơn tấm lòng vàng của bạn.
                </p>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end w-full mt-12 px-16">
                <div className="text-left flex gap-6 items-center">
                  <div className="bg-white p-3 border-2 border-slate-200 rounded-xl shadow-sm">
                    <QRCode value={qrValue} size={100} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-sm text-slate-500 uppercase tracking-widest font-bold mb-2">Xác thực điện tử</p>
                    <p className="text-sm text-slate-600 font-mono bg-slate-50 px-3 py-1.5 rounded border border-slate-200 inline-block font-semibold">ID: {record.id.substring(0, 12).toUpperCase()}</p>
                  </div>
                </div>
                
                <div className="text-center relative">
                  <p className="text-lg text-slate-600 mb-20 italic font-serif" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Ngày cấp: {format(parseISO(record.date), 'dd/MM/yyyy')}</p>
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 h-40 opacity-10 mix-blend-multiply pointer-events-none">
                    <ShieldCheck className={`w-full h-full ${theme.shield}`} strokeWidth={1} />
                  </div>
                  <div className="relative z-10">
                    {/* Digital Signature */}
                    <div className="flex flex-col items-center">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/f/f8/John_Hancock_signature.png" 
                        alt="Signature" 
                        className="h-16 object-contain mix-blend-multiply mb-2"
                        crossOrigin="anonymous"
                      />
                      <p className="font-bold text-slate-900 uppercase text-sm tracking-widest border-t border-slate-300 pt-2 inline-block px-8">Đại diện ban tổ chức</p>
                      <p className="text-sm text-slate-600 mt-1 font-medium">{event.organizer}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCVView = () => {
    return (
      <div className="fixed inset-0 z-[-1] overflow-hidden opacity-0 pointer-events-none">
        <div 
          ref={cvRef}
          className="w-[800px] bg-white p-12 relative"
          style={{ minHeight: '1131px' }} // A4 portrait ratio
        >
          <div className="border-b-4 border-red-600 pb-6 mb-8 flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center border-4 border-white shadow-lg">
              <Heart className="w-12 h-12 text-red-600 fill-red-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tight">Hồ Sơ Thiện Nguyện</h1>
              <h2 className="text-2xl text-slate-600 mt-1">{currentUser.name}</h2>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-12">
            <div className="col-span-1 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Thông tin cá nhân</h3>
                <p className="text-slate-800 font-medium">Email: <span className="font-normal">{currentUser.email}</span></p>
                <p className="text-slate-800 font-medium">Nhóm máu: <span className="font-bold text-red-600">{currentUser.bloodGroup || 'Chưa cập nhật'}</span></p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Tổng quan</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-black text-slate-900">{completedRecords.length}</p>
                    <p className="text-sm text-slate-500 font-medium">Lần hiến máu</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-red-600">{completedRecords.reduce((acc, r) => acc + r.amount, 0)} ml</p>
                    <p className="text-sm text-slate-500 font-medium">Tổng lượng máu</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-emerald-600">{completedRecords.length * 3}</p>
                    <p className="text-sm text-slate-500 font-medium">Người được giúp (ước tính)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <h3 className="text-lg font-bold text-slate-900 border-b-2 border-slate-200 pb-2 mb-6 flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-red-600" />
                Lịch sử hoạt động
              </h3>
              <div className="space-y-6">
                {completedRecords.map((record, index) => {
                  const event = events.find(e => e.id === record.eventId);
                  if (!event) return null;
                  return (
                    <div key={record.id} className="relative pl-6 border-l-2 border-slate-200">
                      <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-1.5 border-2 border-white"></div>
                      <p className="text-sm font-bold text-red-600 mb-1">{format(parseISO(record.date), 'MM/yyyy')}</p>
                      <h4 className="text-lg font-bold text-slate-900">{event.title}</h4>
                      <p className="text-slate-600 text-sm mt-1">{event.organizer} • {event.location}</p>
                      <p className="text-slate-800 font-medium mt-2 bg-slate-100 inline-block px-3 py-1 rounded-full text-sm">
                        Đóng góp: {record.amount} ml máu
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-12 left-12 right-12 text-center border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500 italic">Hồ sơ được tạo tự động từ hệ thống quản lý hiến máu tình nguyện.</p>
            <p className="text-xs text-slate-400 mt-1">Ngày tạo: {format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {completedRecords.length === 0 ? (
        <Card className="text-center py-16 shadow-sm max-w-2xl mx-auto mt-8">
          <CardContent>
            <Award className="w-16 h-16 mx-auto mb-6 text-slate-300" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Chưa có chứng nhận</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">Bạn cần hoàn thành ít nhất một lần hiến máu để nhận được giấy chứng nhận điện tử.</p>
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
              <Link to="/events">Tìm sự kiện hiến máu</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'list' && (
            <ListView 
              records={filteredRecords} 
              events={events} 
              onSelect={(id) => { setSelectedRecordId(id); setViewMode('detail'); }}
              onDownload={(id) => handleDownload(id)}
              onShare={(id) => handleShare(id)}
              setYearFilter={setYearFilter}
              setEventFilter={setEventFilter}
              yearFilter={yearFilter}
              eventFilter={eventFilter}
              availableYears={availableYears}
              availableEvents={availableEvents}
            />
          )}
          {viewMode === 'detail' && selectedRecord && selectedEvent && (
            <DetailView 
              record={selectedRecord} 
              event={selectedEvent} 
              theme={currentTheme} 
              currentUser={currentUser}
              onBack={() => setViewMode('list')}
              onDownload={handleDownload}
              onShare={handleShare}
              isGenerating={isGenerating}
              certificateRef={certificateRef}
            />
          )}
          {viewMode === 'cv' && renderCVView()}
        </>
      )}
      {/* Generated Image Modal */}
      {generatedImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Ảnh đã được tạo thành công</h3>
              <Button variant="ghost" size="sm" onClick={() => setGeneratedImageUrl(null)} className="rounded-full w-8 h-8 p-0">
                <X className="w-5 h-5 text-slate-500" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-50 flex justify-center items-center">
              <img src={generatedImageUrl || undefined} alt="Generated" className="max-w-full max-h-full object-contain shadow-md border border-slate-200" />
            </div>
            <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-500 text-center sm:text-left">
                <span className="font-medium text-slate-700">Mẹo:</span> Nếu nút tải xuống không hoạt động, hãy <span className="font-bold text-red-600">nhấn giữ</span> (trên điện thoại) hoặc <span className="font-bold text-red-600">chuột phải</span> (trên máy tính) vào ảnh và chọn "Lưu ảnh".
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setGeneratedImageUrl(null)}>
                  Đóng
                </Button>
                <Button className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white gap-2" onClick={() => {
                  const link = document.createElement('a');
                  link.download = generatedImageName;
                  link.href = generatedImageUrl;
                  link.click();
                }}>
                  <Download className="w-4 h-4" />
                  Tải xuống
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
