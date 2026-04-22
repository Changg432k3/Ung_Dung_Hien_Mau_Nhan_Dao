import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, Activity, Users, MapPin, ShieldCheck, Gift, BookOpen, User as UserIcon, Flame, Newspaper, Droplet, Award, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post } from '../types';
import ReactMarkdown from 'react-markdown';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), where('status', '==', 'published'), orderBy('publishDate', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = [];
      snapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
    }, (error) => {
      console.error("Firestore Error in Home.tsx:", error);
    });
    return () => unsub();
  }, []);

  const featuredPosts = posts.filter(p => p.isFeatured);
  const urgentPosts = posts.filter(p => p.category === 'urgent');
  const newsPosts = posts.filter(p => p.category === 'news');
  const storyPosts = posts.filter(p => p.category === 'stories');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-white -z-10"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-red-100/50 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-rose-100/50 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 font-medium text-sm mb-8"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>Nền tảng hiến máu tình nguyện 4.0</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8"
            >
              Kết nối dòng máu <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">Chia sẻ sự sống</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed"
            >
              Máu+ giúp bạn dễ dàng tìm kiếm sự kiện hiến máu, theo dõi lịch sử, nhận chứng nhận số và tích điểm đổi quà. Hãy cùng chúng tôi lan tỏa yêu thương!
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button 
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                Đăng ký hiến máu <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/public-events')}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                Xem lịch hiến máu
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                <Droplet className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">15,000+</h3>
              <p className="text-slate-500 font-medium">Đơn vị máu</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">8,500+</h3>
              <p className="text-slate-500 font-medium">Người hiến máu</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">320+</h3>
              <p className="text-slate-500 font-medium">Sự kiện tổ chức</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">50+</h3>
              <p className="text-slate-500 font-medium">Điểm hiến máu</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tại sao chọn Máu+?</h2>
            <p className="text-lg text-slate-600">Ứng dụng mang đến trải nghiệm hiến máu hoàn toàn mới, tiện lợi và minh bạch hơn bao giờ hết.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Đăng ký dễ dàng</h3>
              <p className="text-slate-600 leading-relaxed">Tìm kiếm và đăng ký tham gia các sự kiện hiến máu gần bạn chỉ với vài thao tác đơn giản trên điện thoại.</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Chứng nhận điện tử</h3>
              <p className="text-slate-600 leading-relaxed">Nhận ngay giấy chứng nhận hiến máu điện tử sau khi hoàn thành. Dễ dàng lưu trữ, chia sẻ và xác thực.</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <Gift className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Tích điểm đổi quà</h3>
              <p className="text-slate-600 leading-relaxed">Mỗi lần hiến máu bạn sẽ nhận được điểm thưởng. Sử dụng điểm để đổi lấy các phần quà hấp dẫn từ đối tác.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Urgent Notices */}
      {urgentPosts.length > 0 && (
        <section className="py-12 bg-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <Flame className="w-8 h-8 text-red-200" />
              <h2 className="text-2xl font-bold">Thông báo khẩn cấp</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {urgentPosts.map(post => (
                <div 
                  key={post.id} 
                  className="bg-red-700/50 hover:bg-red-700 border border-red-500/50 p-6 rounded-2xl cursor-pointer transition-colors"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-red-200 text-sm line-clamp-2">{post.description || 'Nhấn để xem chi tiết thông báo khẩn cấp này.'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-slate-900">Bài viết nổi bật</h2>
              <button className="text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredPosts.slice(0, 2).map(post => (
                <div 
                  key={post.id} 
                  className="group cursor-pointer rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={post.coverImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold rounded-full uppercase tracking-wider">
                        Nổi bật
                      </span>
                    </div>
                  </div>
                  <div className="p-8 bg-white">
                    <h3 className="font-bold text-2xl text-slate-900 mb-3 group-hover:text-red-600 transition-colors line-clamp-2">{post.title}</h3>
                    <p className="text-slate-600 line-clamp-2 mb-4">{post.description}</p>
                    <div className="flex items-center text-sm text-slate-500 font-medium">
                      <span>{post.publishDate && !isNaN(new Date(post.publishDate).getTime()) ? new Date(post.publishDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Sẵn sàng trao đi giọt máu đào?</h2>
          <p className="text-xl text-slate-300 mb-10 leading-relaxed">
            Mỗi lần hiến máu, bạn có thể cứu sống đến 3 người bệnh. Hãy tham gia cộng đồng Máu+ ngay hôm nay để tạo nên những điều kỳ diệu.
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="px-10 py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-xl transition-all shadow-xl shadow-red-600/20"
          >
            Tạo tài khoản miễn phí
          </button>
        </div>
      </section>
    </div>
  );
};
