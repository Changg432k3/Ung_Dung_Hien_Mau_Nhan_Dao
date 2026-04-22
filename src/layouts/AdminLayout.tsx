import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Droplet, 
  BarChart3, 
  Award, 
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  FileText,
  Activity,
  Lock,
  MapPin,
  Trophy,
  Eye,
  Settings,
  User as UserIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useApp } from '../store/AppContext';
import { ChatAssistant } from '../components/ChatAssistant';

import { motion, AnimatePresence } from 'motion/react';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, updateUser, changePassword } = useApp();
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

  useEffect(() => {
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

  const navigation = [
    { name: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
    { name: 'Sự kiện', href: '/admin/events', icon: CalendarDays },
    { name: 'Điểm hiến máu', href: '/admin/locations', icon: MapPin },
    { name: 'Người tham gia', href: '/admin/participants', icon: Users },
    { name: 'Người hiến máu', href: '/admin/donors', icon: Droplet },
    { name: 'Tồn kho máu', href: '/admin/inventory', icon: Activity },
    { name: 'Báo cáo & Thống kê', href: '/admin/reports', icon: BarChart3 },
    { name: 'Bảng xếp hạng', href: '/admin/leaderboard', icon: Trophy },
    { name: 'Quản lý Huy hiệu', href: '/admin/badges', icon: Award },
    { name: 'Quản lý Chứng nhận', href: '/admin/certificates', icon: FileText },
    { name: 'Quản lý bài viết', href: '/admin/posts', icon: FileText },
  ];

  const systemNavigation = [
    { name: 'Phân quyền', href: '/admin/roles', icon: ShieldCheck },
    { name: 'Bảo mật', href: '/admin/security', icon: Lock },
  ];

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex overflow-hidden">
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
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-red-600">
            <Droplet className="w-6 h-6 fill-current" />
            <span className="font-bold text-lg tracking-tight">Máu+ Admin</span>
          </div>
          <button 
            className="ml-auto lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          <div className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active 
                      ? 'bg-red-50 text-red-700' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'text-red-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {currentUser?.role === 'admin' && (
            <div>
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Hệ thống & Bảo mật
              </h3>
              <div className="space-y-1">
                {systemNavigation.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active 
                          ? 'bg-red-50 text-red-700' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${active ? 'text-red-600' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="relative">
            <button 
              className="flex items-center gap-3 mb-4 w-full text-left hover:bg-slate-100 p-2 rounded-lg transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <img 
                src={currentUser?.avatar || "https://i.pravatar.cc/150?u=admin"} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{currentUser?.name || 'Admin'}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser?.email || 'admin@mau+.vn'}</p>
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
          <div className="flex flex-col gap-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-500 hover:text-slate-700"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex relative w-64 lg:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
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
      </main>
      <ChatAssistant />
      
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
                <img src={currentUser?.avatar || "https://i.pravatar.cc/150?u=admin"} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <p className="font-medium">{currentUser?.name || 'Admin'}</p>
                  <p className="text-sm text-slate-500">{currentUser?.email || 'admin@mau+.vn'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Số điện thoại</p>
                  <p className="text-sm">{currentUser?.phone || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Vai trò</p>
                  <p className="text-sm">Admin</p>
                </div>
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

              {/* Notifications */}
              <div className="flex items-center justify-between border-t pt-4">
                <h3 className="font-medium text-slate-900">🔔 Thông báo email</h3>
                <input type="checkbox" className="w-5 h-5 text-red-600" defaultChecked />
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