import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp, UserRole } from '../store/AppContext';
import { Heart, ArrowRight, Activity, Users, MapPin, ArrowLeft, Mail, Lock, User as UserIcon, ShieldCheck, Calendar, Info, BookOpen, CheckCircle2, Gift, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

type ViewState = 'landing' | 'login' | 'register';

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 }
};

const pageTransition = { 
  duration: 0.3, 
  ease: "easeInOut" 
} as const;

export const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (selectedRole: 'donor' | 'admin') => {
    try {
      setIsLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Fetch user data directly from Firestore to get their real role
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      const userData = userDoc.data();
      
      let realRole = userData?.role || selectedRole;
      
      // Default admin check
      if (result.user.email === 'tranhatrangnguyen@gmail.com') {
        realRole = 'admin';
      }
      
      let finalUserData = userData;
      // Create or update user document
      if (!userDoc.exists()) {
        finalUserData = {
          name: result.user.displayName || 'Người dùng',
          email: result.user.email,
          role: realRole,
          points: 0,
          donationsCount: 0,
          avatar: result.user.photoURL || undefined,
          seenBadges: []
        };
        await setDoc(doc(db, 'users', result.user.uid), finalUserData);
      } else if (userDoc.data().role !== realRole && realRole === 'admin') {
        // Update role to admin if it was previously something else
        await updateDoc(doc(db, 'users', result.user.uid), {
          role: 'admin'
        });
        finalUserData = { ...userData, role: 'admin' };
      }
      
      login(realRole as UserRole, result.user, finalUserData);
      
      if (['admin', 'staff', 'organizer'].includes(realRole)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return; // Ignore user cancellation
      }
      setError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
      toast.error("Đăng nhập bằng Google thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (email === 'admin@mau+.vn' && password === 'admin') {
      login('admin');
      navigate('/admin');
      setIsLoading(false);
      return;
    }
    
    if (email === 'donor@mau+.vn' && password === 'donor') {
      login('donor');
      navigate('/dashboard');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      
      if (userData) {
        login(userData.role as UserRole, userCredential.user, userData);
      } else {
        login('donor', userCredential.user);
      }
      
      if (userData && ['admin', 'staff', 'organizer'].includes(userData.role)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError('Email hoặc mật khẩu không chính xác.');
      toast.error('Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoRole: 'donor' | 'admin') => {
    handleGoogleLogin(demoRole);
  };

  return (
    <motion.div 
      key="login"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="min-h-screen flex items-center justify-center p-4 relative bg-slate-50"
    >
      <Button 
        variant="ghost" 
        className="absolute top-6 left-6 text-slate-500 hover:text-slate-900"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Trang chủ
      </Button>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <Heart className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Đăng nhập</h2>
          <p className="mt-2 text-sm text-slate-600">Chào mừng bạn quay trở lại Máu+</p>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="nhap@email.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-900">Mật khẩu</label>
                  <a href="#" className="text-sm text-red-600 hover:text-red-700">Quên mật khẩu?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600 cursor-pointer">
                  Nhớ đăng nhập
                </label>
              </div>

              <Button type="submit" className="w-full py-6 text-base mt-2" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </Button>
            </form>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="mt-6">
              <Button 
                variant="outline" 
                className="w-full py-6 text-base flex items-center justify-center gap-2"
                onClick={() => handleGoogleLogin('donor')}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Đăng nhập bằng Google
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-red-600 hover:text-red-700">
                Đăng ký ngay
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
