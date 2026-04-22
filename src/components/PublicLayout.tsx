import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Menu, X, ArrowRight, User as UserIcon, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store/AppContext';

export const PublicLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useApp();

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Về chúng tôi', path: '/about-us' },
    { name: 'Sự kiện', path: '/public-events' },
    { name: 'Hướng dẫn', path: '/guide' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 w-full z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-xl text-slate-900">Máu+</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className="text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(['admin', 'staff', 'organizer'].includes(currentUser.role) ? '/admin' : '/dashboard')}>
                Bảng điều khiển
              </Button>
              <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                <img src={currentUser.avatar || undefined} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-100" />
                <span className="text-sm font-medium text-slate-700">{currentUser.name}</span>
              </div>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')} className="hidden sm:inline-flex">
                Đăng nhập
              </Button>
              <Button onClick={() => navigate('/register')} className="rounded-full px-6 hidden sm:inline-flex">
                Đăng ký
              </Button>
            </>
          )}
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden"
          >
            <nav className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl font-bold text-slate-900 hover:text-red-600 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                {currentUser ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <img src={currentUser.avatar || undefined} alt="Avatar" className="w-10 h-10 rounded-full bg-slate-100" />
                      <div>
                        <p className="font-medium text-slate-900">{currentUser.name}</p>
                        <p className="text-sm text-slate-500">{currentUser.email}</p>
                      </div>
                    </div>
                    <Button size="lg" onClick={() => { setIsMenuOpen(false); navigate(['admin', 'staff', 'organizer'].includes(currentUser.role) ? '/admin' : '/dashboard'); }}>
                      Bảng điều khiển
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => { setIsMenuOpen(false); handleLogout(); }}>
                      Đăng xuất
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="lg" variant="outline" onClick={() => { setIsMenuOpen(false); navigate('/login'); }}>
                      Đăng nhập
                    </Button>
                    <Button size="lg" onClick={() => { setIsMenuOpen(false); navigate('/register'); }}>
                      Đăng ký ngay
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-16">
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
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <span className="font-bold text-xl">Máu+</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Nền tảng kết nối người hiến máu và các cơ sở y tế hàng đầu Việt Nam.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Khám phá</h4>
            <ul className="space-y-3 text-slate-400 text-sm">
              <li><Link to="/about-us" className="hover:text-white transition-colors">Về chúng tôi</Link></li>
              <li><Link to="/public-events" className="hover:text-white transition-colors">Sự kiện</Link></li>
              <li><Link to="/guide" className="hover:text-white transition-colors">Hướng dẫn</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Hỗ trợ</h4>
            <ul className="space-y-3 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Liên hệ</h4>
            <p className="text-slate-400 text-sm">
              Email: contact@mau+.vn<br />
              Hotline: 1900 1234<br />
              Địa chỉ: Hà Nội, Việt Nam
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-slate-500 text-xs">
          © 2026 Máu+. Tất cả quyền được bảo lưu.
        </div>
      </footer>
    </div>
  );
};
