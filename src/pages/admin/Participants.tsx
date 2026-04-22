import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, Download, QrCode, CheckCircle, Gift, AlertTriangle, X, UserCheck, CheckCircle2, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useSearchParams } from 'react-router-dom';
import { useApp, BloodGroup } from '../../store/AppContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Participant {
  id: string; // recordId
  userId: string;
  name: string;
  phone: string;
  email: string;
  bloodGroup: string;
  status: 'registered' | 'checked-in' | 'completed' | 'cancelled';
  registrationDate: string;
  giftReceived: boolean;
  eventName: string;
  eventId: string;
}

export const AdminParticipants: React.FC = () => {
  const { records, users, events, rewards, checkInUser, completeDonation, updateUser, userLocation, calculateDistance, receiveGift } = useApp();
  const [searchParams] = useSearchParams();
  const eventParam = searchParams.get('event');
  
  const [searchQuery, setSearchQuery] = useState(eventParam || '');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<Participant | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Gift Modal State
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [selectedParticipantForGift, setSelectedParticipantForGift] = useState<Participant | null>(null);
  
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedParticipantForComplete, setSelectedParticipantForComplete] = useState<Participant | null>(null);
  const [completeData, setCompleteData] = useState({
    amount: 350,
    bloodGroup: 'Chưa xác định' as BloodGroup
  });

  // Filter available gifts from rewards inventory
  const availableGifts = useMemo(() => {
    return rewards.filter(r => r.stock > 0);
  }, [rewards]);

  const [selectedGifts, setSelectedGifts] = useState<string[]>([]);

  // Reset selected gifts when modal opens
  useEffect(() => {
    if (isGiftModalOpen) {
      setSelectedGifts([]);
    }
  }, [isGiftModalOpen]);

  const CATEGORY_LABELS: Record<string, string> = {
    shirt: 'Áo thun',
    badge: 'Huy hiệu',
    voucher: 'Voucher',
    souvenir: 'Vật phẩm lưu niệm'
  };

  const groupedGifts = useMemo(() => {
    return availableGifts.reduce((acc, gift) => {
      const category = gift.category || 'souvenir';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(gift);
      return acc;
    }, {} as Record<string, typeof availableGifts>);
  }, [availableGifts]);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Map real data to Participant interface
  const participants = useMemo(() => {
    return records.map(record => {
      const user = users.find(u => u.id === record.userId);
      const event = events.find(e => e.id === record.eventId) || events.find(e => e.title === record.eventId);
      
      return {
        id: record.id,
        userId: record.userId,
        name: user?.name || 'Người dùng ẩn danh',
        phone: user?.phone || 'N/A',
        email: user?.email || 'N/A',
        bloodGroup: record.bloodGroup || user?.bloodGroup || 'Chưa xác định',
        status: record.status as any,
        registrationDate: record.date,
        giftReceived: !!record.giftReceived,
        giftType: record.giftType,
        eventName: event?.title || record.eventId || 'Sự kiện không xác định',
        eventId: record.eventId
      } as Participant;
    }).filter(p => p.status !== 'cancelled');
  }, [records, users, events]);

  useEffect(() => {
    if (eventParam) {
      setSearchQuery(eventParam);
    }
  }, [eventParam]);

  // Detect duplicates
  const duplicatePhones = useMemo(() => {
    const counts = participants.reduce((acc, p) => {
      acc[p.phone] = (acc[p.phone] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).filter(phone => counts[phone] > 1);
  }, [participants]);

  const duplicateEmails = useMemo(() => {
    const counts = participants.reduce((acc, p) => {
      acc[p.email] = (acc[p.email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).filter(email => counts[email] > 1);
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.eventName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBloodGroup = bloodGroupFilter ? p.bloodGroup === bloodGroupFilter : true;
      const matchesStatus = statusFilter ? p.status === statusFilter : true;
      return matchesSearch && matchesBloodGroup && matchesStatus;
    }).sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
  }, [participants, searchQuery, bloodGroupFilter, statusFilter]);

  const handleExportExcel = () => {
    // Simple CSV export
    const headers = ['ID', 'Họ tên', 'Số điện thoại', 'Email', 'Nhóm máu', 'Trạng thái', 'Ngày đăng ký', 'Đã nhận quà', 'Sự kiện'];
    const csvContent = [
      headers.join(','),
      ...filteredParticipants.map(p => 
        [p.id, `"${p.name}"`, p.phone, p.email, p.bloodGroup, p.status, p.registrationDate, p.giftReceived ? 'Có' : 'Không', `"${p.eventName}"`].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'danh_sach_dang_ky.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCheckIn = (id: string) => {
    checkInUser(id);
    toast.success('Check-in thành công!');
  };

  const handleCompleteDonation = (participant: Participant) => {
    setSelectedParticipantForComplete(participant);
    setCompleteData({
      amount: 350,
      bloodGroup: (participant.bloodGroup as BloodGroup) || 'Chưa xác định'
    });
    setIsCompleteModalOpen(true);
  };

  const confirmCompleteDonation = () => {
    if (selectedParticipantForComplete) {
      completeDonation(selectedParticipantForComplete.id, completeData.amount, completeData.bloodGroup);
      toast.success(`Đã xác nhận hoàn thành hiến máu cho ${selectedParticipantForComplete.name}`);
      setIsCompleteModalOpen(false);
    }
  };

  const handleRecordGift = (participant: Participant) => {
    setSelectedParticipantForGift(participant);
    setIsGiftModalOpen(true);
  };

  const confirmGiftDistribution = () => {
    if (selectedParticipantForGift) {
      if (selectedGifts.length === 0) {
        toast.error('Vui lòng chọn ít nhất một phần quà.');
        return;
      }
      receiveGift(selectedParticipantForGift.id, selectedGifts);
      toast.success(`Đã phát ${selectedGifts.join(', ')} cho ${selectedParticipantForGift.name}`);
      setIsGiftModalOpen(false);
      setSelectedParticipantForGift(null);
    }
  };

  // QR Scanner Logic
  useEffect(() => {
    if (isQRModalOpen && !qrScanResult) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(error => {
            console.error("Failed to clear scanner", error);
          });
        }
      };
    }
  }, [isQRModalOpen, qrScanResult]);

  function onScanSuccess(decodedText: string) {
    setScanError(null);
    // The QR code should contain the recordId or a specific format
    let recordId = decodedText;
    try {
      const data = JSON.parse(decodedText);
      recordId = data.recordId || data.id || decodedText;
    } catch (e) {
      // Not JSON, use as is
    }

    const participant = participants.find(p => p.id === recordId);

    if (!participant) {
      setScanError('Mã QR không hợp lệ hoặc không tìm thấy thông tin đăng ký.');
      toast.error('Mã QR không hợp lệ.');
      return;
    }

    const event = events.find(e => e.id === participant.eventId) || events.find(e => e.title === participant.eventId);
    if (!event) {
      setScanError('Không tìm thấy thông tin sự kiện liên quan.');
      return;
    }

    // ⏱ Check-in theo thời gian
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      // Set hours for time comparison
      const [startTimeStr, endTimeStr] = event.time.split(' - ');
      const [startH, startM] = startTimeStr.split(':').map(Number);
      const [endH, endM] = endTimeStr.split(':').map(Number);
      
      const eventStart = new Date(startDate);
      eventStart.setHours(startH, startM, 0, 0);
      
      const eventEnd = new Date(endDate);
      eventEnd.setHours(endH, endM, 0, 0);

      if (now < eventStart) {
        setScanError(`Sự kiện chưa bắt đầu. Thời gian diễn ra: ${event.time} ngày ${format(startDate, 'dd/MM/yyyy')}`);
        return;
      }

      if (now > eventEnd) {
        setScanError('Sự kiện đã kết thúc. Không thể check-in.');
        return;
      }
    }

    // 📍 Check-in theo vị trí (GPS)
    if (userLocation && event.lat && event.lng) {
      const distance = calculateDistance(userLocation.lat, userLocation.lng, event.lat, event.lng);
      const MAX_DISTANCE_KM = 0.5; // 500 meters

      if (distance > MAX_DISTANCE_KM) {
        setScanError(`Bạn đang ở quá xa địa điểm sự kiện (${distance}km). Vui lòng di chuyển đến gần hơn để check-in (tối đa 500m).`);
        return;
      }
    } else if (!userLocation) {
      setScanError('Vui lòng bật định vị GPS để thực hiện check-in theo vị trí.');
      return;
    }

    if (participant.status === 'checked-in') {
      toast.info(`${participant.name} đã check-in trước đó.`);
      setQrScanResult(participant);
      return;
    }

    if (participant.status === 'completed') {
      toast.info(`${participant.name} đã hoàn thành hiến máu.`);
      setQrScanResult(participant);
      return;
    }

    // Valid check-in
    setIsProcessing(true);
    setTimeout(() => {
      handleCheckIn(participant.id);
      setQrScanResult(participant);
      setIsProcessing(false);
      
      // Stop scanner after success
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    }, 1000);
  }

  function onScanFailure(error: any) {
    // console.warn(`Code scan error = ${error}`);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered': return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Chưa đến</Badge>;
      case 'checked-in': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Đã check-in</Badge>;
      case 'completed': return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Đã hiến tặng</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Người tham gia</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý danh sách đăng ký và check-in sự kiện.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
          <Button onClick={() => setIsQRModalOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white">
            <QrCode className="w-4 h-4" />
            Quét QR Check-in
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, SĐT, email..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white flex-1"
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
          >
            <option value="">Tất cả nhóm máu</option>
            <option value="Chưa xác định">Chưa xác định</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
          <select 
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white flex-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="registered">Chưa đến</option>
            <option value="checked-in">Đã check-in</option>
            <option value="donated">Đã hiến tặng</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Họ tên</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Nhóm máu</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Quà tặng</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((p) => {
                  const isDuplicatePhone = duplicatePhones.includes(p.phone);
                  const isDuplicateEmail = duplicateEmails.includes(p.email);
                  const hasDuplicate = isDuplicatePhone || isDuplicateEmail;

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${hasDuplicate ? 'bg-orange-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {p.name}
                          {hasDuplicate && (
                            <span title="Phát hiện thông tin trùng lặp" className="text-orange-500">
                              <AlertTriangle className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-xs mt-1">{p.eventName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1 ${isDuplicatePhone ? 'text-orange-600 font-medium' : 'text-slate-600'}`}>
                          {p.phone}
                        </div>
                        <div className={`text-xs mt-1 ${isDuplicateEmail ? 'text-orange-600 font-medium' : 'text-slate-500'}`}>
                          {p.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-red-600">
                        {p.bloodGroup}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="px-6 py-4">
                        {p.giftReceived ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle className="w-4 h-4" /> Đã nhận
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Chưa nhận</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {p.status === 'registered' && (
                          <Button size="sm" variant="outline" onClick={() => handleCheckIn(p.id)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                            Check-in
                          </Button>
                        )}
                        {p.status === 'checked-in' && (
                          <Button size="sm" variant="outline" onClick={() => handleCompleteDonation(p)} className="text-green-600 border-green-200 hover:bg-green-50">
                            <UserCheck className="w-4 h-4 mr-1" /> Hoàn thành
                          </Button>
                        )}
                        {p.status === 'completed' && (
                          p.giftReceived ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" /> Đã phát
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRecordGift(p)}>
                              <Gift className="w-4 h-4 mr-1" /> Phát quà
                            </Button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Không tìm thấy người tham gia nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
              <h3 className="font-bold text-lg">Quét mã QR Check-in</h3>
              <button onClick={() => {
                setIsQRModalOpen(false);
                setQrScanResult(null);
              }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {qrScanResult ? (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">Check-in thành công!</h4>
                    <p className="text-slate-500 mt-1">Thông tin người hiến máu:</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Họ tên:</span>
                      <span className="font-bold text-slate-900">{qrScanResult.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Nhóm máu:</span>
                      <span className="font-bold text-red-600">{qrScanResult.bloodGroup}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Sự kiện:</span>
                      <span className="font-medium text-slate-900 text-right max-w-[200px] truncate">{qrScanResult.eventName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">Trạng thái:</span>
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Đã check-in</Badge>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setQrScanResult(null)} 
                      className="flex-1"
                    >
                      Quét tiếp
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsQRModalOpen(false);
                        setQrScanResult(null);
                      }} 
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      Đóng
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div id="reader" className="overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50 min-h-[300px]">
                    {/* Html5QrcodeScanner will render here */}
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Vui lòng cấp quyền truy cập camera và định vị GPS. Hệ thống sẽ tự động xác thực vị trí và thời gian diễn ra sự kiện.
                    </p>
                  </div>

                  {scanError && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 leading-relaxed font-medium">
                        {scanError}
                      </p>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="flex items-center justify-center gap-2 text-slate-600">
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Đang xác thực thông tin...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Gift Distribution Modal */}
      {isGiftModalOpen && selectedParticipantForGift && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
              <h3 className="font-bold text-lg">Xác nhận phát quà</h3>
              <button onClick={() => setIsGiftModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Họ tên:</span>
                  <span className="font-bold text-slate-900">{selectedParticipantForGift.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Nhóm máu:</span>
                  <span className="font-bold text-red-600">{selectedParticipantForGift.bloodGroup}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Sự kiện:</span>
                  <span className="font-medium text-slate-900 text-right max-w-[200px] truncate">{selectedParticipantForGift.eventName}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Chọn quà tặng:</label>
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-4">
                  {Object.keys(groupedGifts).length > 0 ? (
                    Object.entries(groupedGifts).map(([category, gifts]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{CATEGORY_LABELS[category] || category}</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {gifts.map((gift) => {
                            const isSelected = selectedGifts.includes(gift.name);
                            return (
                              <label key={`${gift.id}-${category}`} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                                <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  value={gift.name} 
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedGifts(prev => [...prev, gift.name]);
                                    } else {
                                      setSelectedGifts(prev => prev.filter(g => g !== gift.name));
                                    }
                                  }}
                                />
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 shrink-0 ${isSelected ? 'border-red-500 bg-red-500' : 'border-slate-300'}`}>
                                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                </div>
                                {gift.imageUrl ? (
                                  <img src={gift.imageUrl || undefined} alt={gift.name} className="w-10 h-10 object-cover rounded-md mr-3 border border-slate-200 bg-white" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-10 h-10 rounded-md mr-3 border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <Gift className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className={`text-sm font-medium ${isSelected ? 'text-red-700' : 'text-slate-700'}`}>{gift.name}</div>
                                  <div className="text-xs text-slate-500">Còn lại: {gift.stock}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">
                      Hết quà tặng trong kho. Vui lòng cập nhật kho quà tặng.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setIsGiftModalOpen(false)} 
                className="flex-1"
              >
                Hủy
              </Button>
              <Button 
                onClick={confirmGiftDistribution} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Xác nhận phát quà
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Complete Donation Modal */}
      {isCompleteModalOpen && selectedParticipantForComplete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
              <h3 className="font-bold text-lg">Xác nhận hoàn thành hiến máu</h3>
              <button onClick={() => setIsCompleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Họ tên:</span>
                  <span className="font-bold text-slate-900">{selectedParticipantForComplete.name}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Lượng máu đã hiến (ml)</label>
                  <input 
                    type="number" 
                    value={completeData.amount}
                    onChange={(e) => setCompleteData({...completeData, amount: Number(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nhóm máu</label>
                  <select 
                    value={completeData.bloodGroup}
                    onChange={(e) => setCompleteData({...completeData, bloodGroup: e.target.value as BloodGroup})}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="Chưa xác định">Chưa xác định</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setIsCompleteModalOpen(false)} 
                className="flex-1"
              >
                Hủy
              </Button>
              <Button 
                onClick={confirmCompleteDonation} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};