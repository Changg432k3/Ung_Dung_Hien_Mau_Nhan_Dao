import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Heart, Home, Calendar, History, Award, Settings, LogOut, User as UserIcon, MapPin, QrCode, Gift, Menu, X, Bell, Users, HelpCircle, Info, BookOpen, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { useNotifications } from '../hooks/useNotifications';
import { ChatAssistant } from './ChatAssistant';
import { NotificationCenter } from './NotificationCenter';
import { BadgePopup } from './BadgePopup';

export const Layout: React.FC = () => {
  const { currentUser, logout, updateUser, changePassword } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isViewProfileModalOpen, setIsViewProfileModalOpen] = useState(false);
  const [isAccountSettingsModalOpen, setIsAccountSettingsModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    avatar: currentUser?.avatar || ''
  });

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Mật khẩu không khớp!');
      return;
    }
    await changePassword(passwordForm.newPassword);
    setIsChangePasswordModalOpen(false);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
  };

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSaveSettings = async () => {
    if (currentUser) {
      await updateUser(currentUser.id, settingsForm);
      setIsAccountSettingsModalOpen(false);
    }
  };

  useNotifications();

  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const donorLinks = [
    { name: 'Trang chủ', path: '/', icon: Home },
    { name: 'Sự kiện', path: '/events', icon: Calendar },
    { name: 'Hồ sơ', path: '/profile', icon: UserIcon },
    { name: 'Lịch sử', path: '/history', icon: History },
    { name: 'Cộng đồng', path: '/community', icon: Users },
    { name: 'Chứng nhận', path: '/certificate', icon: Award },
    { name: 'Quà tặng', path: '/rewards', icon: Gift },
  ];

  const links = donorLinks;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:shrink-0 flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between lg:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <span className="font-bold text-xl text-slate-900">Máu+</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-red-50 text-red-700 shadow-sm ring-1 ring-red-100' 
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm hover:ring-1 hover:ring-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-5 bg-red-600 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 transition-colors duration-200 ${
                  isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                <span className="relative">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="relative">
            <button 
              className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 w-full text-left hover:bg-slate-100 transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <img src={currentUser.avatar || undefined} alt="Avatar" className="w-10 h-10 rounded-full bg-white" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{`Nhóm máu: ${currentUser.bloodGroup || 'Chưa cập nhật'}`}</p>
              </div>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsViewProfileModalOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4" /> Xem hồ sơ
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsAccountSettingsModalOpen(true);
                  }}
                >
                  <Settings className="w-4 h-4" /> Cài đặt tài khoản
                </button>
              </div>
            )}
          </div>
          <Button variant="ghost" className="w-full justify-start text-slate-600 mt-2" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-3 text-slate-400" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-visible">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center">
            <button 
              className="text-slate-500 hover:text-slate-700"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="ml-4 flex items-center gap-2 text-red-600">
              <Heart className="w-5 h-5 fill-current" />
              <span className="font-bold text-lg text-slate-900">Máu+</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <button 
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* Header cho Desktop ở bên phải */}
          <div className="hidden lg:flex justify-end items-center px-8 py-4 bg-white/50 backdrop-blur-sm border-b border-slate-200/50">
            <NotificationCenter />
          </div>
          <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      <ChatAssistant />
      <BadgePopup />

      {/* View Profile Modal */}
      {isViewProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Xem hồ sơ</h2>
              <button onClick={() => setIsViewProfileModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={currentUser.avatar || undefined} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <p className="font-medium">{currentUser.name}</p>
                  <p className="text-sm text-slate-500">{currentUser.email}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-slate-500">Số điện thoại</p>
                <p className="text-sm">{currentUser.phone || 'Chưa cập nhật'}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-slate-500">Vai trò</p>
                <p className="text-sm">Người hiến máu</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings Modal */}
      {isAccountSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Cài đặt tài khoản</h2>
              <button onClick={() => setIsAccountSettingsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-3">
                <h3 className="font-medium text-slate-900">✏️ Thông tin cá nhân</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên</label>
                  <input 
                    type="text" 
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input 
                    type="text" 
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Avatar URL</label>
                  <input 
                    type="text" 
                    value={settingsForm.avatar}
                    onChange={(e) => setSettingsForm({...settingsForm, avatar: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2" 
                  />
                </div>
              </div>

              {/* Security */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">🔒 Bảo mật</h3>
                <Button variant="outline" className="w-full" onClick={() => {
                  setIsAccountSettingsModalOpen(false);
                  setIsChangePasswordModalOpen(true);
                }}>Đổi mật khẩu</Button>
              </div>

              {/* Appearance */}
              <div className="flex items-center justify-between border-t pt-4">
                <h3 className="font-medium text-slate-900 dark:text-slate-100">🎨 Dark mode 🌙</h3>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 text-red-600" 
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                />
              </div>

              <Button onClick={handleSaveSettings} className="w-full bg-red-600 hover:bg-red-700">Lưu thay đổi</Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold dark:text-white">Đổi mật khẩu</h2>
              <button onClick={() => setIsChangePasswordModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 dark:bg-slate-700 dark:text-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Xác nhận mật khẩu</label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 dark:bg-slate-700 dark:text-white" 
                />
              </div>
              <Button onClick={handleChangePassword} className="w-full bg-red-600 hover:bg-red-700">Đổi mật khẩu</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
