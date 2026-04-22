import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle2, Heart, Activity, User as UserIcon, Gift, ShieldCheck, AlertTriangle, Coffee, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Accordion } from '../components/ui/Accordion';

export const Guide: React.FC = () => {
  const faqItems = [
    { title: "Ai có thể hiến máu?", content: "Người khỏe mạnh từ 18-60 tuổi, cân nặng ít nhất 42kg (nữ) và 45kg (nam). Không mắc các bệnh truyền nhiễm qua đường máu." },
    { title: "Khoảng cách giữa 2 lần hiến máu là bao lâu?", content: "Khoảng cách tối thiểu là 12 tuần (3 tháng) đối với hiến máu toàn phần. Đối với hiến thành phần máu (như tiểu cầu), khoảng cách có thể ngắn hơn (khoảng 2-3 tuần)." },
    { title: "Hiến máu có hại cho sức khỏe không?", content: "Không. Lượng máu hiến chỉ chiếm khoảng 1/10 tổng lượng máu cơ thể và sẽ được tái tạo nhanh chóng. Hiến máu định kỳ còn giúp giảm nguy cơ mắc các bệnh về tim mạch và sắt dư thừa." },
    { title: "Tôi có được biết kết quả xét nghiệm máu không?", content: "Có. Kết quả xét nghiệm sàng lọc (HIV, viêm gan B, viêm gan C, giang mai, sốt rét) sẽ được gửi bảo mật đến bạn qua ứng dụng Máu+ hoặc qua đường bưu điện." },
    { title: "Cần mang theo giấy tờ gì khi đi hiến máu?", content: "Bạn cần mang theo Chứng minh nhân dân, Căn cước công dân hoặc Hộ chiếu (bản gốc) để làm thủ tục đăng ký." }
  ];

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-6xl mx-auto px-6 relative z-1 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-red-400 text-xs font-bold uppercase tracking-wider mb-6"
          >
            <BookOpen className="w-3 h-3" /> Hướng dẫn hiến máu
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Quy trình hiến máu <br />
            <span className="text-red-500">An toàn & Ý nghĩa</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto"
          >
            Chào mừng bạn đến với hành trình cứu sống người bệnh. Dưới đây là mọi thông tin bạn cần biết để có một trải nghiệm hiến máu tốt nhất.
          </motion.p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">4 Bước thực hiện</h2>
          <p className="text-slate-500 mt-4">Quy trình chuẩn giúp bạn yên tâm khi tham gia hiến máu.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Đăng ký thông tin",
              desc: "Đăng ký tài khoản trên Máu+, hoàn thiện hồ sơ sức khỏe và chọn sự kiện phù hợp.",
              icon: <UserIcon className="w-6 h-6" />,
              color: "bg-blue-50 text-blue-600"
            },
            {
              step: "02",
              title: "Khám sức khỏe",
              desc: "Bác sĩ kiểm tra huyết áp, nhịp tim và các chỉ số máu để đảm bảo bạn đủ điều kiện hiến máu.",
              icon: <Activity className="w-6 h-6" />,
              color: "bg-amber-50 text-amber-600"
            },
            {
              step: "03",
              title: "Thực hiện hiến máu",
              desc: "Quá trình lấy máu diễn ra trong 10-15 phút. Bạn sẽ được nhân viên y tế chăm sóc tận tình.",
              icon: <Heart className="w-6 h-6" />,
              color: "bg-red-50 text-red-600"
            },
            {
              step: "04",
              title: "Nghỉ ngơi & Nhận quà",
              desc: "Nghỉ ngơi 15-30 phút, dùng nhẹ và nhận chứng nhận điện tử cùng quà tri ân từ ban tổ chức.",
              icon: <Gift className="w-6 h-6" />,
              color: "bg-emerald-50 text-emerald-600"
            }
          ].map((item, i) => (
            <motion.div 
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <span className="absolute top-8 right-8 text-4xl font-black text-slate-50">{item.step}</span>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Preparation Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-slate-900">Chuẩn bị trước khi hiến máu</h2>
              <div className="space-y-6">
                {[
                  { title: 'Ngủ đủ giấc', desc: 'Đảm bảo ngủ ít nhất 6 tiếng vào đêm trước ngày hiến máu.', icon: <Clock className="w-5 h-5" /> },
                  { title: 'Ăn nhẹ', desc: 'Ăn nhẹ trước khi hiến máu, tránh các thực phẩm nhiều dầu mỡ.', icon: <Coffee className="w-5 h-5" /> },
                  { title: 'Uống nhiều nước', desc: 'Uống khoảng 500ml nước trước khi thực hiện hiến máu.', icon: <Activity className="w-5 h-5" /> },
                  { title: 'Mang theo giấy tờ', desc: 'Mang theo CCCD hoặc giấy tờ tùy thân có ảnh.', icon: <ShieldCheck className="w-5 h-5" /> },
                ].map((tip, i) => (
                  <div key={tip.title} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      {tip.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{tip.title}</h4>
                      <p className="text-sm text-slate-500">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-slate-900">Lưu ý sau khi hiến máu</h2>
              <div className="space-y-6">
                {[
                  { title: 'Nghỉ ngơi tại chỗ', desc: 'Nghỉ ít nhất 15 phút tại điểm hiến máu trước khi ra về.', icon: <Clock className="w-5 h-5" /> },
                  { title: 'Bổ sung dinh dưỡng', desc: 'Ăn uống đầy đủ, ưu tiên các thực phẩm giàu sắt.', icon: <Coffee className="w-5 h-5" /> },
                  { title: 'Tránh vận động mạnh', desc: 'Không làm việc nặng hoặc tập thể thao cường độ cao trong 24h.', icon: <AlertTriangle className="w-5 h-5" /> },
                  { title: 'Giữ vệ sinh vết tiêm', desc: 'Giữ băng dán trong ít nhất 4-6 tiếng để tránh nhiễm trùng.', icon: <ShieldCheck className="w-5 h-5" /> },
                ].map((tip, i) => (
                  <div key={tip.title} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      {tip.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{tip.title}</h4>
                      <p className="text-sm text-slate-500">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-16">Câu hỏi thường gặp</h2>
        <Accordion items={faqItems} />
      </section>
    </div>
  );
};
