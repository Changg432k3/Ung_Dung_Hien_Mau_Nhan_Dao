import React from 'react';
import { motion } from 'motion/react';
import { Heart, Info, CheckCircle2, Users, ShieldCheck, Globe, Target } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

export const AboutUs: React.FC = () => {
  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-red-50/50 skew-x-12 translate-x-1/2" />
        <div className="max-w-6xl mx-auto px-6 relative z-1">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider mb-6"
            >
              <Info className="w-3 h-3" /> Về chúng tôi
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6"
            >
              Sứ mệnh kết nối <br />
              <span className="text-red-600">Vì một cộng đồng khỏe mạnh</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 leading-relaxed mb-8"
            >
              Máu+ là nền tảng công nghệ nhân đạo hàng đầu Việt Nam, ra đời với mục đích tối ưu hóa quy trình hiến máu tình nguyện và xây dựng mạng lưới cứu sống người bệnh.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Người hiến máu', value: '50,000+' },
              { label: 'Đơn vị máu', value: '120,000+' },
              { label: 'Bệnh viện đối tác', value: '150+' },
              { label: 'Sự kiện mỗi năm', value: '1,200+' },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">Tại sao Máu+ ra đời?</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Chúng tôi nhận thấy rằng việc kết nối giữa người hiến và người cần máu vẫn còn nhiều rào cản. Máu+ sử dụng sức mạnh của công nghệ để xóa bỏ những khoảng cách đó, đảm bảo nguồn máu an toàn luôn sẵn sàng cho những ai cần nhất.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'Tầm nhìn', desc: 'Trở thành mạng lưới hiến máu lớn nhất Đông Nam Á.', icon: <Globe className="w-5 h-5" /> },
                { title: 'Mục tiêu', desc: 'Giảm 50% thời gian tìm kiếm máu hiếm khẩn cấp.', icon: <Target className="w-5 h-5" /> },
              ].map((item, i) => (
                <div key={item.title} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-4">
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <ul className="space-y-4">
              {[
                "Số hóa quy trình đăng ký và quản lý hồ sơ hiến máu.",
                "Cung cấp bản đồ điểm hiến máu thời gian thực.",
                "Hệ thống thông báo khẩn cấp khi có nhu cầu máu hiếm.",
                "Tôn vinh và tri ân người hiến máu qua hệ thống huy hiệu."
              ].map((item, i) => (
                <li key={item} className="flex items-start gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-red-100 rounded-full blur-3xl opacity-50" />
            <img 
              src="https://media.vietnamplus.vn/images/42139c4ac0f1efdabeea97c7f4c5345701280f62a048f1b49bf1ae1342aab3356ad95511b5a30c80ad1ebc5a0ba328fe/ttxvn-hien-mau-2007.jpg" 
              alt="About Máu+" 
              className="rounded-[2.5rem] shadow-2xl relative z-1 w-full aspect-[4/5] object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 hidden md:block z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200">
                  <Heart className="w-8 h-8 fill-current" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">100%</p>
                  <p className="text-sm text-slate-500 font-medium">Vì mục đích nhân đạo</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-16">Giá trị cốt lõi của chúng tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Minh bạch', desc: 'Mọi quy trình và dữ liệu đều được quản lý công khai, minh bạch.', icon: <ShieldCheck className="w-8 h-8" /> },
              { title: 'Kết nối', desc: 'Xây dựng cộng đồng gắn kết, sẵn sàng giúp đỡ lẫn nhau.', icon: <Users className="w-8 h-8" /> },
              { title: 'Sáng tạo', desc: 'Luôn ứng dụng công nghệ mới nhất để cải thiện quy trình.', icon: <Target className="w-8 h-8" /> },
            ].map((value, i) => (
              <div key={value.title} className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-red-500 mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold">{value.title}</h3>
                <p className="text-slate-400 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
