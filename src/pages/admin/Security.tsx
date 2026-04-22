import React, { useState } from 'react';
import { Shield, Lock, Smartphone, AlertTriangle, Key, History, CheckCircle2, XCircle, Eye, EyeOff, Copy, Check, ClipboardPaste } from 'lucide-react';

export const AdminSecurity: React.FC = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const twoFAInputRef = React.useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    
    const fallbackCopyTextToClipboard = (text: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          setNotification({ type: 'success', message: 'Đã sao chép mã thiết lập.' });
          setTimeout(() => setNotification(null), 2000);
        } else {
          setNotification({ type: 'error', message: 'Không thể sao chép mã.' });
          setTimeout(() => setNotification(null), 2000);
        }
      } catch (err) {
        setNotification({ type: 'error', message: 'Không thể sao chép mã.' });
        setTimeout(() => setNotification(null), 2000);
      }

      document.body.removeChild(textArea);
    };

    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(secret);
      return;
    }
    
    navigator.clipboard.writeText(secret)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        setNotification({ type: 'success', message: 'Đã sao chép mã thiết lập.' });
        setTimeout(() => setNotification(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        fallbackCopyTextToClipboard(secret);
      });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('JBSWY3DPEHPK3PXP')) {
        setTwoFACode('123456');
        setNotification({ type: 'success', message: 'Chế độ thử nghiệm: Đã tự động điền mã 6 số hợp lệ.' });
        setTimeout(() => setNotification(null), 4000);
        return;
      }
      const cleaned = text.replace(/\D/g, '').slice(0, 6);
      if (cleaned) {
        setTwoFACode(cleaned);
        setNotification({ type: 'success', message: 'Đã dán mã xác thực.' });
        setTimeout(() => setNotification(null), 2000);
      } else {
        setNotification({ type: 'error', message: 'Không tìm thấy mã số hợp lệ trong clipboard.' });
        setTimeout(() => setNotification(null), 2000);
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      setNotification({ type: 'error', message: 'Không thể truy cập clipboard. Vui lòng dán thủ công (Ctrl+V).' });
      setTimeout(() => setNotification(null), 3000);
      twoFAInputRef.current?.focus();
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      setNotification({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin.' });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setNotification({ type: 'error', message: 'Mật khẩu mới không khớp.' });
      return;
    }
    if (passwordForm.new.length < 8) {
      setNotification({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
      return;
    }

    // Simulate API call
    setNotification({ type: 'success', message: 'Mật khẩu đã được cập nhật thành công!' });
    setPasswordForm({ current: '', new: '', confirm: '' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleVerify2FA = () => {
    if (twoFACode.length === 6) {
      setNotification({ type: 'success', message: 'Xác thực 2 lớp đã được thiết lập thành công!' });
      setTwoFACode('');
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: 'error', message: 'Mã xác thực phải gồm 6 chữ số từ ứng dụng Authenticator.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const [sessions, setSessions] = useState([
    { id: 1, device: 'MacBook Pro - Chrome', location: 'Hà Nội, Việt Nam', ip: '192.168.1.105', status: 'active', current: true },
    { id: 2, device: 'iPhone 13 Pro - Safari', location: 'Hà Nội, Việt Nam', ip: '113.190.22.45', status: '2 giờ trước', current: false },
    { id: 3, device: 'Windows PC - Firefox', location: 'Hồ Chí Minh, VN', ip: '14.225.12.8', status: 'failed', current: false }
  ]);

  const handleLogoutSession = (id: number) => {
    setSessions(sessions.filter(s => s.id !== id));
    setNotification({ type: 'success', message: 'Đã đăng xuất thiết bị thành công.' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogoutAll = () => {
    setSessions(sessions.filter(s => s.current));
    setNotification({ type: 'success', message: 'Đã đăng xuất khỏi tất cả các thiết bị khác.' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bảo mật tài khoản</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý đăng nhập, xác thực 2 lớp (2FA) và theo dõi bất thường.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* 2FA Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Xác thực 2 lớp (2FA)</h2>
                  <p className="text-sm text-slate-500">Bảo vệ tài khoản bằng mã xác nhận qua ứng dụng Authenticator.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={is2FAEnabled}
                  onChange={() => setIs2FAEnabled(!is2FAEnabled)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {is2FAEnabled && (
              <div className="p-6 bg-white border-b border-slate-200">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="bg-slate-100 p-4 rounded-lg flex items-center justify-center w-32 h-32 flex-shrink-0">
                    <div className="w-24 h-24 border-4 border-dashed border-slate-300 flex items-center justify-center bg-white">
                      <QrCode className="w-12 h-12 text-slate-300" />
                    </div>
                  </div>
                  <div className="space-y-4 flex-1">
                    <p className="text-sm text-slate-600">
                      1. Tải ứng dụng Google Authenticator hoặc Authy.<br/>
                      2. Quét mã QR bên cạnh hoặc nhập mã thủ công bên dưới.<br/>
                      3. Nhập mã 6 số từ ứng dụng để xác nhận.
                    </p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-sm text-slate-700 flex items-center justify-between">
                      <span>JBSWY3DPEHPK3PXP</span>
                      <button 
                        onClick={handleCopy}
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs uppercase flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input 
                          ref={twoFAInputRef}
                          type="text" 
                          placeholder="Nhập mã 6 số (Dán: Ctrl+V)" 
                          value={twoFACode}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.includes('JBSWY3DPEHPK3PXP')) {
                              setTwoFACode('123456');
                              setNotification({ type: 'success', message: 'Chế độ thử nghiệm: Đã tự động điền mã 6 số hợp lệ.' });
                              setTimeout(() => setNotification(null), 4000);
                              return;
                            }
                            setTwoFACode(val.replace(/\D/g, '').slice(0, 6));
                          }}
                          onPaste={(e) => {
                            const pastedData = e.clipboardData.getData('text');
                            if (pastedData.includes('JBSWY3DPEHPK3PXP')) {
                              setTwoFACode('123456');
                              setNotification({ type: 'success', message: 'Chế độ thử nghiệm: Đã tự động điền mã 6 số hợp lệ.' });
                              setTimeout(() => setNotification(null), 4000);
                              e.preventDefault();
                              return;
                            }
                            const cleaned = pastedData.replace(/\D/g, '').slice(0, 6);
                            if (cleaned) {
                              setTwoFACode(cleaned);
                              setNotification({ type: 'success', message: 'Đã dán mã xác thực.' });
                              setTimeout(() => setNotification(null), 2000);
                              e.preventDefault();
                            }
                          }}
                          className="w-full bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 pr-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handlePaste}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Dán mã"
                        >
                          <ClipboardPaste className="w-4 h-4" />
                        </button>
                      </div>
                      <button 
                        onClick={handleVerify2FA}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-4 py-2 transition-colors"
                      >
                        Xác nhận
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Mẹo: Bạn có thể dán mã trực tiếp vào ô trên (Ctrl+V hoặc nhấn giữ).</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Management */}
          <div id="password-section" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Key className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Đổi mật khẩu</h2>
                <p className="text-sm text-slate-500">Nên thay đổi mật khẩu định kỳ 3 tháng/lần.</p>
              </div>
            </div>
            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg text-sm px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button 
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg text-sm px-4 py-2.5 transition-colors"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Login History & Alerts */}
        <div className="space-y-6">
          {/* Abnormal Logins Alert */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">Cảnh báo đăng nhập</h3>
                <p className="text-sm text-amber-700 mt-1 mb-3">Phát hiện 2 lần đăng nhập thất bại từ địa chỉ IP lạ trong 24h qua.</p>
                <button 
                  onClick={() => setIsAlertModalOpen(true)}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium rounded-lg text-xs px-3 py-1.5 transition-colors"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>

          {/* Recent Devices */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h2 className="font-semibold text-slate-800 text-sm">Thiết bị & Phiên đăng nhập</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    session.status === 'active' ? 'bg-emerald-100' : session.status === 'failed' ? 'bg-red-50' : 'bg-slate-100'
                  }`}>
                    {session.status === 'active' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : 
                     session.status === 'failed' ? <XCircle className="w-4 h-4 text-red-500" /> : 
                     <Smartphone className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{session.device}</p>
                    <p className="text-xs text-slate-500">{session.location} • {session.ip}</p>
                    {session.status === 'active' ? (
                      <p className="text-xs text-emerald-600 font-medium mt-1">Đang hoạt động (Thiết bị hiện tại)</p>
                    ) : session.status === 'failed' ? (
                      <p className="text-xs text-red-500 mt-1">Đăng nhập thất bại (Sai mật khẩu)</p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">Hoạt động {session.status}</p>
                    )}
                  </div>
                  {!session.current && session.status !== 'failed' && (
                    <button 
                      onClick={() => handleLogoutSession(session.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Đăng xuất
                    </button>
                  )}
                </div>
              ))}
            </div>
            {sessions.length > 1 && (
              <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
                <button 
                  onClick={handleLogoutAll}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Đăng xuất khỏi tất cả thiết bị khác
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert Details Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-amber-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Chi tiết cảnh báo đăng nhập</h3>
                  <p className="text-xs text-amber-700">Phát hiện các hoạt động bất thường</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAlertModalOpen(false)}
                className="p-2 hover:bg-amber-100 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              <div className="space-y-3">
                {[
                  { time: '07:42:15 - Hôm nay', ip: '14.225.12.8', location: 'Hồ Chí Minh, VN', reason: 'Sai mật khẩu (Lần 1)', device: 'Windows PC - Firefox' },
                  { time: '07:44:30 - Hôm nay', ip: '14.225.12.8', location: 'Hồ Chí Minh, VN', reason: 'Sai mật khẩu (Lần 2)', device: 'Windows PC - Firefox' },
                  { time: '22:15:05 - Hôm qua', ip: '103.15.22.45', location: 'Singapore', reason: 'IP lạ truy cập', device: 'Unknown Device' },
                ].map((item, i) => (
                  <div key={item.time} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500">{item.time}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600 uppercase">{item.reason}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Địa chỉ IP</p>
                        <p className="font-medium text-slate-700">{item.ip}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Vị trí</p>
                        <p className="font-medium text-slate-700">{item.location}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400">Thiết bị</p>
                        <p className="font-medium text-slate-700">{item.device}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Khuyến nghị:</strong> Nếu đây không phải là bạn, hãy đổi mật khẩu ngay lập tức và đăng xuất khỏi tất cả các thiết bị khác.
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsAlertModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  setIsAlertModalOpen(false);
                  // Scroll to password change section
                  document.getElementById('password-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Đổi mật khẩu ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QrCode = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M7 7h.01" /><path d="M17 7h.01" /><path d="M7 17h.01" /><path d="M17 17h.01" />
  </svg>
);

