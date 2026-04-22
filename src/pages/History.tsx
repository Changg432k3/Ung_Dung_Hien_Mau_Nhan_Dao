import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { History as HistoryIcon, Droplets, Calendar, MapPin, CheckCircle2, Clock, XCircle, Award, UserCheck, Filter, Heart, Users, Building2, Search, X } from 'lucide-react';
import { format, parseISO, isAfter, subMonths, startOfYear, endOfYear, subYears, differenceInDays, addDays, addMonths, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { motion, AnimatePresence } from 'motion/react';

export const History = () => {
  const { currentUser, records, events, cancelRegistration, completeDonation, checkInUser } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, recordId: string, eventTitle: string}>({isOpen: false, recordId: '', eventTitle: ''});
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const RecordModal = () => {
    if (!selectedRecord) return null;
    const event = events.find(e => e.id === selectedRecord.eventId);
    const statusConfig = getStatusConfig(selectedRecord.status);

    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedRecord(null)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Chi tiết bản ghi</h2>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${statusConfig.bg} ${statusConfig.text}`}>
                  {statusConfig.icon}
                </div>
                <span className="font-semibold text-lg">{statusConfig.label}</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Sự kiện</p>
                <p className="font-medium text-slate-900">{event?.title}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Thời gian</p>
                <p className="font-medium text-slate-900">{format(parseISO(selectedRecord.date), 'EEEE, dd/MM/yyyy', { locale: vi })}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Địa điểm</p>
                <p className="font-medium text-slate-900">{event?.location} - {event?.address}</p>
              </div>
              {selectedRecord.status === 'completed' && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Lượng máu</p>
                    <p className="font-medium text-slate-900">{selectedRecord.amount} ml</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500">Nhóm máu</p>
                    <p className="font-medium text-slate-900">{selectedRecord.bloodGroup}</p>
                  </div>
                </>
              )}
            </div>
            <div className="mt-8">
              <Button className="w-full" onClick={() => setSelectedRecord(null)}>Đóng</Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const myRecords = useMemo(() => {
    if (!currentUser) return [];
    return records.filter(r => r.userId === currentUser.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentUser, records]);

  const completedRecords = useMemo(() => {
    return myRecords.filter(r => r.status === 'completed');
  }, [myRecords]);

  // Extract unique years and locations for filters
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    myRecords.forEach(r => years.add(format(parseISO(r.date), 'yyyy')));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [myRecords]);

  const availableLocations = useMemo(() => {
    const locations = new Set<string>();
    myRecords.forEach(r => {
      const event = events.find(e => e.id === r.eventId);
      if (event) {
        // Extract city/province (assuming it's the last part of the location string or just use the whole location)
        locations.add(event.location);
      }
    });
    return Array.from(locations).sort();
  }, [myRecords, events]);

  const filteredRecords = useMemo(() => {
    return myRecords.filter(record => {
      const event = events.find(e => e.id === record.eventId);
      if (!event) return false;

      // Status filter
      if (statusFilter !== 'all' && record.status !== statusFilter) return false;

      // Year filter
      const recordYear = format(parseISO(record.date), 'yyyy');
      if (yearFilter !== 'all' && recordYear !== yearFilter) return false;

      // Location filter
      if (locationFilter !== 'all' && event.location !== locationFilter) return false;

      return true;
    });
  }, [myRecords, events, statusFilter, yearFilter, locationFilter]);

  if (!currentUser) return null;

  // Calculate next donation eligibility
  const lastCompletedDonation = completedRecords.length > 0 ? completedRecords[0] : null;
  let nextDonationDate = new Date();
  let isEligible = true;
  let daysRemaining = 0;
  let progressPercentage = 100;
  
  if (lastCompletedDonation) {
    const lastDate = parseISO(lastCompletedDonation.date);
    if (isValid(lastDate)) {
      nextDonationDate = addMonths(lastDate, 3);
      const now = new Date();
      isEligible = isAfter(now, nextDonationDate) || now.getTime() === nextDonationDate.getTime();
      
      if (!isEligible) {
        daysRemaining = Math.max(0, differenceInDays(nextDonationDate, now));
        const totalDays = differenceInDays(nextDonationDate, lastDate);
        const daysPassed = differenceInDays(now, lastDate);
        progressPercentage = Math.min(100, (daysPassed / totalDays) * 100);
      }
    } else {
      isEligible = true;
    }
  }

  const handleCancel = (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    const event = events.find(e => e.id === record?.eventId);
    setConfirmModal({
      isOpen: true,
      recordId,
      eventTitle: event?.title || 'sự kiện này'
    });
  };

  const donationCount = completedRecords.length;
  const totalAmount = completedRecords.reduce((acc, r) => acc + r.amount, 0);
  const peopleHelped = donationCount * 3; // Estimate: 1 donation helps up to 3 people

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Đã hoàn thành' };
      case 'checked-in':
        return { icon: <UserCheck className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Đã check-in' };
      case 'registered':
        return { icon: <Clock className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Đã đăng ký' };
      case 'cancelled':
        return { icon: <XCircle className="w-5 h-5 text-red-500" />, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'Đã hủy' };
      default:
        return { icon: <Clock className="w-5 h-5 text-slate-500" />, bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', label: 'Không rõ' };
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Lịch sử hiến máu</h1>
          <p className="text-slate-500 mt-2">Theo dõi hành trình trao giọt máu hồng của bạn.</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <HistoryIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tổng số lần hiến</p>
                <p className="text-2xl font-bold text-slate-900">{donationCount} <span className="text-base font-normal text-slate-500">lần</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Droplets className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Tổng số ml đã hiến</p>
                <p className="text-2xl font-bold text-slate-900">{totalAmount} <span className="text-base font-normal text-slate-500">ml</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-l-4 border-l-emerald-500 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Ước tính số người đã giúp</p>
                <p className="text-2xl font-bold text-slate-900">{peopleHelped} <span className="text-base font-normal text-slate-500">người</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Donation Eligibility */}
      <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-white to-slate-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Heart className={`w-8 h-8 ${isEligible ? 'text-red-500 fill-red-500' : 'text-red-400'}`} />
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {isEligible ? 'Bạn đã đủ điều kiện hiến máu!' : `Còn ${daysRemaining} ngày nữa bạn có thể hiến lại`}
                </h3>
                {!isEligible && (
                  <span className="text-sm font-medium text-slate-500">
                    Dự kiến: {format(nextDonationDate, 'dd/MM/yyyy')}
                  </span>
                )}
              </div>
              
              <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${isEligible ? 'bg-emerald-500' : 'bg-red-500'}`} 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-slate-500">
                {isEligible 
                  ? 'Cảm ơn bạn đã luôn sẵn sàng chia sẻ giọt máu hồng. Hãy tìm kiếm sự kiện gần nhất nhé!' 
                  : 'Khoảng cách an toàn giữa 2 lần hiến máu toàn phần là 12 tuần (84 ngày) để đảm bảo sức khỏe.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700 font-medium shrink-0">
          <Filter className="w-5 h-5 text-slate-400" />
          <span>Bộ lọc:</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 outline-none transition-colors"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">Tất cả các năm</option>
            {availableYears.map(year => (
              <option key={year} value={year}>Năm {year}</option>
            ))}
          </select>
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 outline-none transition-colors"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">Tất cả địa điểm</option>
            {availableLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block w-full p-2.5 outline-none transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="checked-in">Đã check-in</option>
            <option value="registered">Đã đăng ký</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div id="records" className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record, index) => {
            const event = events.find(e => e.id === record.eventId);
            if (!event) return null;

            const statusConfig = getStatusConfig(record.status);

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${statusConfig.bg} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                  {statusConfig.icon}
                </div>
                
                <Card 
                  className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] shadow-sm hover:shadow-md transition-shadow border-l-4 ${statusConfig.border} cursor-pointer`}
                  onClick={() => setSelectedRecord(record)}
                >
                  <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap w-fit ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                      {statusConfig.label}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{format(parseISO(record.date), 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{event.location} - {event.address}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{event.organizer}</span>
                      </div>
                      
                      {record.status === 'completed' && (
                        <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 px-6 pb-2 rounded-b-xl">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Droplets className="w-4 h-4 text-red-500" />
                              <span className="text-slate-500">Lượng máu:</span>
                              <span className="font-semibold text-slate-900">{record.amount} ml</span>
                            </div>
                            <div className="w-px h-4 bg-slate-300"></div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">Nhóm máu:</span>
                              <span className="font-semibold text-slate-900 text-red-600">{record.bloodGroup}</span>
                            </div>
                          </div>
                          <div className="pb-2">
                            <Button size="sm" variant="outline" className="w-full bg-white" asChild>
                              <Link to={`/events/${event.id}`}>
                                Viết đánh giá
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  {(record.status === 'registered' || record.status === 'checked-in') && (
                    <CardFooter className="pt-0 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      {record.status === 'registered' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => checkInUser(record.id)}>
                          Check-in
                        </Button>
                      )}
                      {record.status === 'checked-in' && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
                          const amountStr = window.prompt('Nhập lượng máu đã hiến (ml):', '350');
                          if (!amountStr) return;
                          const amount = parseInt(amountStr);
                          const bg = window.prompt('Nhập nhóm máu (A+, A-, B+, B-, AB+, AB-, O+, O-):', 'O+');
                          if (amount > 0 && bg) {
                            completeDonation(record.id, amount, bg as any);
                          }
                        }}>
                          Hoàn thành
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => handleCancel(record.id)}>
                        Hủy
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 mt-8">
            <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-900">Không tìm thấy lịch sử hiến máu</p>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">Không có sự kiện nào khớp với bộ lọc hiện tại của bạn.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setStatusFilter('all'); setYearFilter('all'); setLocationFilter('all'); }}>
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <RecordModal />
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          cancelRegistration(confirmModal.recordId);
          toast.success(`Đã hủy đăng ký sự kiện "${confirmModal.eventTitle}"`);
        }}
        title="Xác nhận hủy đăng ký"
        description={`Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện "${confirmModal.eventTitle}"? Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận hủy"
        cancelText="Quay lại"
        variant="danger"
      />
    </div>
  );
};
