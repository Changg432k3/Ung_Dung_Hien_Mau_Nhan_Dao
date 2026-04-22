import React, { useState, Suspense, lazy } from 'react';
import { useApp } from '../store/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Heart, Calendar, Award, Droplets, ArrowRight, MapPin, Clock, X, Users, HeartHandshake, Trophy, Medal, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EventCard } from '../components/EventCard';
import { format, parseISO, addMonths, isAfter, differenceInDays, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

const ChallengesSection = lazy(() => import('../components/ChallengesSection'));
const BannerCarousel = lazy(() => import('../components/BannerCarousel').then(module => ({ default: module.BannerCarousel })));
const FeaturedEventCard = lazy(() => import('../components/FeaturedEventCard').then(module => ({ default: module.FeaturedEventCard })));
const CommunityStatistics = lazy(() => import('../components/CommunityStatistics').then(module => ({ default: module.CommunityStatistics })));
const UserStatsGrid = lazy(() => import('../components/UserStatsGrid').then(module => ({ default: module.UserStatsGrid })));

const communityStories = [
  {
    id: 1,
    title: "Hành trình 50 lần hiến máu của người thầy giáo làng",
    excerpt: "Thầy Nguyễn Văn A đã gắn bó với phong trào hiến máu tình nguyện hơn 20 năm qua, mang lại sự sống cho hàng chục bệnh nhân...",
    content: `
      <p>Thầy Nguyễn Văn A, một giáo viên tiểu học tại vùng quê nghèo, đã trở thành biểu tượng của lòng nhân ái với thành tích 50 lần hiến máu tình nguyện trong suốt 20 năm qua.</p>
      <p>Bắt đầu hành trình từ những năm 2000 khi phong trào hiến máu còn chưa phổ biến, thầy A đã vượt qua những định kiến ban đầu để trao đi những giọt máu quý giá của mình. "Mỗi lần hiến máu, tôi cảm thấy mình đang gieo một hạt giống sự sống. Không gì hạnh phúc hơn khi biết máu của mình có thể cứu sống một ai đó đang trong cơn nguy kịch," thầy chia sẻ.</p>
      <p>Không chỉ trực tiếp hiến máu, thầy còn tích cực vận động đồng nghiệp, phụ huynh và người dân địa phương tham gia. Nhờ sự nỗ lực không mệt mỏi của thầy, phong trào hiến máu tại địa phương đã phát triển mạnh mẽ, cứu sống hàng trăm bệnh nhân mỗi năm.</p>
      <p>Hành trình 50 lần hiến máu của thầy Nguyễn Văn A là minh chứng sống động cho sức mạnh của tình người và lòng vị tha. Thầy là tấm gương sáng để thế hệ trẻ noi theo, tiếp tục lan tỏa thông điệp "Một giọt máu cho đi, một cuộc đời ở lại".</p>
    `,
    image: "https://picsum.photos/seed/story1/600/400",
    category: "Câu chuyện truyền cảm hứng",
    date: "28/02/2026",
    readTime: "5 phút đọc"
  },
  {
    id: 2,
    title: "Ngày hội hiến máu 'Giọt hồng tri ân' thu về 500 đơn vị máu",
    excerpt: "Sự kiện được tổ chức tại Đại học Quốc gia đã thu hút hàng ngàn sinh viên tham gia, vượt chỉ tiêu đề ra...",
    content: `
      <p>Sáng ngày 1/3/2026, Ngày hội hiến máu "Giọt hồng tri ân" đã diễn ra thành công tốt đẹp tại khuôn viên Đại học Quốc gia, thu hút sự tham gia đông đảo của hàng ngàn sinh viên, giảng viên và người dân khu vực lân cận.</p>
      <p>Sự kiện do Hội Sinh viên trường phối hợp cùng Viện Huyết học - Truyền máu Trung ương tổ chức, nhằm mục đích bổ sung lượng máu dự trữ đang thiếu hụt sau dịp Tết Nguyên đán. Với thông điệp ý nghĩa, ngày hội đã nhận được sự hưởng ứng nhiệt tình từ cộng đồng.</p>
      <p>Kết thúc ngày hội, Ban tổ chức đã tiếp nhận thành công 500 đơn vị máu an toàn, vượt 20% so với chỉ tiêu dự kiến ban đầu. Đây là một kết quả đáng khích lệ, thể hiện tinh thần xung kích, tình nguyện vì cộng đồng của tuổi trẻ.</p>
      <p>Đại diện Ban tổ chức chia sẻ: "Chúng tôi vô cùng xúc động trước sự tham gia nhiệt tình của các bạn sinh viên. Những đơn vị máu quý giá này sẽ góp phần mang lại hy vọng sống cho nhiều bệnh nhân đang cần truyền máu. Xin trân trọng cảm ơn tấm lòng vàng của tất cả mọi người."</p>
    `,
    image: "https://picsum.photos/seed/story2/600/400",
    category: "Hoạt động ý nghĩa",
    date: "01/03/2026",
    readTime: "3 phút đọc"
  },
  {
    id: 3,
    title: "Cứu sống bệnh nhân hiếm máu nhờ mạng lưới Máu+",
    excerpt: "Chỉ sau 2 giờ kêu gọi trên nền tảng, 3 người có nhóm máu hiếm O Rh- đã có mặt kịp thời tại bệnh viện...",
    content: `
      <p>Một câu chuyện kỳ diệu vừa xảy ra tại Bệnh viện Chợ Rẫy khi một bệnh nhân mang nhóm máu hiếm O Rh- được cứu sống kịp thời nhờ sự hỗ trợ nhanh chóng từ cộng đồng thông qua nền tảng Máu+.</p>
      <p>Bệnh nhân nhập viện trong tình trạng nguy kịch, mất máu nhiều do tai nạn giao thông. Tuy nhiên, ngân hàng máu của bệnh viện lại đang cạn kiệt nhóm máu O Rh-. Ngay lập tức, một thông báo khẩn cấp đã được phát đi trên hệ thống Máu+, gửi đến tất cả những người dùng có cùng nhóm máu trong khu vực.</p>
      <p>Chỉ chưa đầy 2 giờ sau khi thông báo được phát đi, 3 tình nguyện viên mang nhóm máu O Rh- đã có mặt tại bệnh viện, sẵn sàng hiến máu cứu người. Nhờ những giọt máu quý giá và kịp thời này, ca phẫu thuật đã diễn ra thành công, bệnh nhân qua cơn nguy kịch và đang dần hồi phục.</p>
      <p>Sự việc này một lần nữa khẳng định vai trò quan trọng của mạng lưới kết nối người hiến máu như Máu+ trong việc ứng phó với các tình huống khẩn cấp, đặc biệt là đối với những người mang nhóm máu hiếm. Sự chung tay của cộng đồng chính là phép màu mang lại sự sống cho những người kém may mắn.</p>
    `,
    image: "https://picsum.photos/seed/story3/600/400",
    category: "Tin tức cộng đồng",
    date: "02/03/2026",
    readTime: "4 phút đọc"
  }
];

import { ConfirmationModal } from '../components/ConfirmationModal';

export const UserDashboard: React.FC = () => {
  const { currentUser, events, records, users, cancelRegistration } = useApp();
  const [selectedArticle, setSelectedArticle] = useState<typeof communityStories[0] | null>(null);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleCancelClick = (id: string) => {
    setCancelingId(id);
    setIsConfirmCancelOpen(true);
  };

  const confirmCancel = () => {
    if (cancelingId) {
      cancelRegistration(cancelingId);
      setIsConfirmCancelOpen(false);
      setCancelingId(null);
    }
  };

  if (!currentUser) return null;

  const upcomingEvents = events.filter(e => e.status === 'upcoming').slice(0, 3);
  const myRecords = records.filter(r => r.userId === currentUser.id);
  const myActiveRegistrations = myRecords.filter(r => r.status === 'registered' || r.status === 'checked-in');
  
  const lastDonationDate = currentUser.lastDonationDate && isValid(parseISO(currentUser.lastDonationDate)) ? parseISO(currentUser.lastDonationDate) : null;
  const nextDonationDate = lastDonationDate 
    ? addMonths(lastDonationDate, 3)
    : new Date();
  
  const now = new Date();
  const canDonate = !lastDonationDate || isAfter(now, nextDonationDate) || now.getTime() === nextDonationDate.getTime();
  const daysRemaining = lastDonationDate ? Math.max(0, differenceInDays(nextDonationDate, now)) : 0;

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Xin chào, {currentUser.name}!</h1>
        <p className="text-slate-500 mt-2">Cảm ơn bạn đã đồng hành cùng cộng đồng hiến máu.</p>
      </div>

      {/* Banner Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-xl"></div>}>
          <BannerCarousel />
        </Suspense>
      </motion.div>

      {/* Featured Event */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Suspense fallback={<div className="h-48 bg-slate-100 animate-pulse rounded-xl"></div>}>
          <FeaturedEventCard />
        </Suspense>
      </motion.div>

      {/* Community Statistics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-4"
      >
        <Suspense fallback={<div className="h-32 bg-slate-100 animate-pulse rounded-xl"></div>}>
          <CommunityStatistics />
        </Suspense>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Suspense fallback={<div className="h-32 bg-slate-100 animate-pulse rounded-xl"></div>}>
          <UserStatsGrid />
        </Suspense>
      </motion.div>

      {/* Mini Game Promotion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-lg overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <HelpCircle className="w-32 h-32 rotate-12" />
          </div>
          <CardContent className="p-6 sm:p-8 relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
              <Trophy className="w-10 h-10 text-red-500" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-2xl font-bold mb-2">Thử thách kiến thức hiến máu</h3>
              <p className="text-slate-300 text-sm max-w-xl">
                Tham gia trả lời 5 câu hỏi trắc nghiệm để kiểm tra kiến thức về hiến máu và nhận ngay điểm thưởng để đổi những phần quà hấp dẫn.
              </p>
            </div>
            <Button asChild className="bg-red-600 hover:bg-red-700 px-8 py-6 text-lg rounded-xl shadow-lg shadow-red-900/20 shrink-0">
              <Link to="/community">Chơi ngay</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Card className={`border-l-4 shadow-sm ${canDonate ? 'border-l-emerald-500 bg-emerald-50' : 'border-l-amber-500 bg-amber-50'}`}>
          <CardContent className="p-4 flex items-start gap-4">
            {canDonate ? (
              <>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-900">Bạn đủ điều kiện hiến máu!</h3>
                  <p className="text-sm text-emerald-700 mt-1">Đã qua 3 tháng kể từ lần hiến máu cuối cùng. Hãy tham gia ngay các sự kiện sắp tới.</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">Chưa đủ thời gian giãn cách</h3>
                  <p className="text-sm text-amber-700 mt-1">Bạn cần chờ thêm <span className="font-bold">{daysRemaining} ngày</span> để đủ điều kiện hiến máu tiếp theo (ngày dự kiến: {format(nextDonationDate, 'dd/MM/yyyy')}).</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Challenges Section */}
      <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-xl"></div>}>
        <ChallengesSection />
      </Suspense>

      {/* My Active Registrations */}
      {myActiveRegistrations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Đăng ký của tôi</h2>
            <Button variant="ghost" className="text-slate-500" asChild>
              <Link to="/history">Xem lịch sử <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myActiveRegistrations.map(record => {
              const event = events.find(e => e.id === record.eventId);
              if (!event) return null;
              return (
                <Card key={record.id} className="border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 line-clamp-1">{event.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(parseISO(record.date), 'dd/MM/yyyy')}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <Badge variant={record.status === 'checked-in' ? 'warning' : 'default'} className="text-[10px] px-1.5 py-0 h-4">
                            {record.status === 'checked-in' ? 'Đã check-in' : 'Đã đăng ký'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                        onClick={() => handleCancelClick(record.id)}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Sự kiện sắp tới gần bạn</h2>
          <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" asChild>
            <Link to="/events">Xem tất cả <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map(event => {
            const userRecord = records.find(r => r.eventId === event.id && r.userId === currentUser.id && r.status !== 'cancelled');
            return (
              <EventCard
                key={event.id}
                event={event}
                userRecord={userRecord}
                showHoverOverlay={false}
              />
            );
          })}
        </div>
      </div>

      {/* Community Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Bảng xếp hạng
            </h2>
          </div>
          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4 bg-slate-50/50 border-bottom border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Top người hiến máu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {users
                  .filter(u => u.role === 'donor')
                  .sort((a, b) => b.donationsCount - a.donationsCount)
                  .slice(0, 5)
                  .map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors group">
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500/20' : 
                          index === 1 ? 'bg-slate-100 text-slate-700 ring-2 ring-slate-400/20' : 
                          index === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-400/20' : 
                          'bg-slate-50 text-slate-500'
                        }`}>
                          {index < 3 ? (
                            <Medal className={`w-5 h-5 ${
                              index === 0 ? 'text-amber-500' : 
                              index === 1 ? 'text-slate-400' : 
                              'text-orange-400'
                            }`} />
                          ) : (
                            index + 1
                          )}
                        </div>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full shadow-sm">
                            <Trophy className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate group-hover:text-red-600 transition-colors">{user.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-red-500" />
                          Nhóm máu: <span className="font-semibold text-slate-700">{user.bloodGroup || '??'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900 leading-none">{user.donationsCount}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Lần hiến</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
            <CardFooter className="p-3 bg-slate-50/30 border-t border-slate-100 flex justify-center">
              <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-red-600" asChild>
                <Link to="/leaderboard">Xem bảng xếp hạng đầy đủ</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Achievement Teaser */}
          <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award className="w-24 h-24 rotate-12" />
            </div>
            <CardContent className="p-5 relative z-10">
              <h4 className="font-bold mb-1">Mục tiêu tiếp theo</h4>
              <p className="text-indigo-100 text-xs mb-4">Hiến máu thêm 2 lần nữa để nhận Huy hiệu Bạc!</p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                <div className="bg-white h-full rounded-full" style={{ width: '60%' }}></div>
              </div>
              <p className="text-[10px] text-right text-indigo-200">3/5 lần hoàn thành</p>
            </CardContent>
          </Card>
        </div>

        {/* Community Stories Section */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Khu vực cộng đồng</h2>
            <p className="text-slate-500 mt-1">Những câu chuyện truyền cảm hứng và hoạt động ý nghĩa</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {communityStories.map((story) => (
              <Card 
                key={story.id} 
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border-slate-200/60 flex flex-col"
                onClick={() => setSelectedArticle(story)}
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={story.image || undefined} 
                    alt={story.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-slate-900 hover:bg-white border-none shadow-sm backdrop-blur-sm">
                      {story.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {story.date}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {story.readTime}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
                    {story.excerpt}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <span className="text-red-600 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                      Đọc tiếp <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedArticle(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
            >
              <div className="relative h-64 sm:h-80 shrink-0">
                <img 
                  src={selectedArticle.image || undefined} 
                  alt={selectedArticle.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md"
                  onClick={() => setSelectedArticle(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="bg-red-600 text-white border-none mb-3">
                    {selectedArticle.category}
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                    {selectedArticle.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-slate-300 mt-3">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {selectedArticle.date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {selectedArticle.readTime}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto">
                <div 
                  className="prose prose-slate prose-red max-w-none prose-p:leading-relaxed prose-p:text-slate-600 prose-p:mb-6"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
                
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-sm text-slate-500 font-medium">Chia sẻ bài viết này</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200">
                      Facebook
                    </Button>
                    <Button variant="outline" size="sm" className="text-slate-600 hover:text-sky-500 hover:bg-sky-50 hover:border-sky-200">
                      Twitter
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmCancelOpen}
        onClose={() => setIsConfirmCancelOpen(false)}
        onConfirm={confirmCancel}
        title="Xác nhận hủy đăng ký"
        description="Bạn có chắc chắn muốn hủy đăng ký sự kiện này? Hành động này không thể hoàn tác."
        confirmText="Có, hủy đăng ký"
        cancelText="Không"
        variant="danger"
      />
    </div>
  );
};
