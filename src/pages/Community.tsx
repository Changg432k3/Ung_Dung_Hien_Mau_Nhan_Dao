import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Search,
  MessageSquare, 
  Heart, 
  Share2, 
  Award, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  Send, 
  ImageIcon,
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Clock,
  MapPin,
  Trophy,
  ChevronRight,
  Pin,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import ChallengesSection from '../components/ChallengesSection';
import MiniQuizWidget from '../components/MiniQuizWidget';
import MiniGameTab from '../components/MiniGameTab';
import DonorMapSection from '../components/DonorMapSection';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const Community: React.FC = () => {
  const { 
    currentUser, 
    communityPosts, 
    addCommunityPost, 
    deleteCommunityPost,
    updateCommunityPost,
    pinCommunityPost,
    likePost, 
    addComment,
    emergencyCalls,
    events,
    badges,
    users
  } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [postType, setPostType] = useState<'experience' | 'story' | 'achievement'>('experience');
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);

  const sortedPosts = [...communityPosts]
    .filter(post => post.status === 'approved' || !post.status)
    .filter(post => post.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handleCreatePost = () => {
    if (!newPostContent.trim() || !currentUser) return;
    addCommunityPost({
      userId: currentUser.id,
      content: newPostContent,
      type: postType,
    });
    setNewPostContent('');
  };

  const handleShare = (post: any) => {
    if (navigator.share) {
      navigator.share({
        title: `Bài viết từ ${post.userName} trên Máu+`,
        text: post.content,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
    }
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;
    addComment(postId, commentText);
    setCommentText('');
    setShowCommentInput(null);
  };

  const recentActivities = events
    .filter(e => e.status === 'completed')
    .slice(0, 3);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cộng đồng Máu+</h1>
          <p className="text-slate-500 mt-1">Nơi kết nối và lan tỏa tinh thần hiến máu nhân đạo</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-red-500 outline-none"
          />
        </div>
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-8 bg-white border border-slate-200 p-1 h-auto sm:h-14 rounded-2xl shadow-sm">
          <TabsTrigger value="feed" className="rounded-xl data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Bản tin</TabsTrigger>
          <TabsTrigger value="challenges" className="rounded-xl data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Thử thách</TabsTrigger>
          <TabsTrigger value="minigame" className="rounded-xl data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Trò chơi nhỏ</TabsTrigger>
          <TabsTrigger value="map" className="rounded-xl data-[state=active]:bg-red-50 data-[state=active]:text-red-600">Bản đồ</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              {currentUser && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                >
                  <div className="flex gap-4">
                    <img src={currentUser?.avatar || undefined} alt="Avatar" className="w-12 h-12 rounded-full bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-4">
                      <textarea
                        placeholder="Chia sẻ trải nghiệm hoặc câu chuyện của bạn..."
                        className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none text-slate-700"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                      />
                      
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setPostType('experience')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              postType === 'experience' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Trải nghiệm
                          </button>
                          <button 
                            onClick={() => setPostType('story')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              postType === 'story' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Câu chuyện
                          </button>
                          <button 
                            onClick={() => setPostType('achievement')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              postType === 'achievement' 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Thành tích
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-slate-500">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Ảnh
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleCreatePost}
                            disabled={!newPostContent.trim()}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Đăng bài
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Feed */}
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {sortedPosts.map((post, index) => {
                    const postUser = users.find(u => u.id === post.userId);
                    const isPostAdmin = post.userRole === 'admin' || postUser?.role === 'admin';
                    
                    return (
                    <motion.div
                      key={`${post.id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      {/* Post Header */}
                      <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={post.userAvatar || undefined} alt={post.userName} className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{post.userName}</h3>
                              {isPostAdmin && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                                  Quản trị viên
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{post.date && !isNaN(new Date(post.date).getTime()) ? formatDistanceToNow(new Date(post.date), { addSuffix: true, locale: vi }) : 'Vừa xong'}</span>
                              {post.isPinned && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-700 font-bold flex items-center gap-1.5 text-[10px] bg-red-100 px-2 py-0.5 rounded border border-red-200 uppercase tracking-wider"><Pin className="w-3 h-3" /> Ghim</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {currentUser?.role === 'admin' && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => pinCommunityPost(post.id)} className={`p-2 rounded-lg ${post.isPinned ? 'text-red-600 bg-red-50' : 'text-slate-400'}`}><Pin className="w-5 h-5" /></button>
                            <button onClick={() => deleteCommunityPost(post.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        )}
                      </div>
                      {/* Post Content */}
                      <div className="px-6 pb-4">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        
                        {post.type === 'achievement' && post.badgeId && (
                          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                              <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-amber-900">Đã nhận được huy hiệu mới!</p>
                              <p className="text-xs text-amber-700">{badges.find(b => b.id === post.badgeId)?.name || 'Huy hiệu hiến máu'}</p>
                            </div>
                          </div>
                        )}

                        {post.imageUrls && post.imageUrls.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {post.imageUrls.map((url, i) => (
                              <img key={i} src={url} alt={`Post content ${i}`} className="w-full h-auto object-cover rounded-xl" />
                            ))}
                          </div>
                        )}
                        {post.imageUrl && !post.imageUrls && (
                          <div className="mt-4 rounded-xl overflow-hidden border border-slate-100">
                            <img src={post.imageUrl || undefined} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="px-6 py-4 border-t border-slate-50 flex items-center gap-6">
                        <button 
                          onClick={() => likePost(post.id)}
                          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                            post.likes.includes(currentUser?.id || '') ? 'text-red-600' : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <ThumbsUp className={`w-5 h-5 ${post.likes.includes(currentUser?.id || '') ? 'fill-current' : ''}`} />
                          <span>{post.likes.length} Thích</span>
                        </button>
                        <button 
                          onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>{post.comments.filter(c => c.status === 'approved' || !c.status).length} Bình luận</span>
                        </button>
                        <button 
                          onClick={() => handleShare(post)}
                          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          <Share2 className="w-5 h-5" />
                          <span>Chia sẻ</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      <AnimatePresence>
                        {(showCommentInput === post.id || post.comments.length > 0) && (
                          <motion.div 
                            key={`comments-${post.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-50 border-t border-slate-100"
                          >
                            <div className="p-6 space-y-4">
                              {post.comments.filter(comment => comment.status === 'approved' || !comment.status).map((comment, i) => (
                                <div key={`${comment.id}-${i}`} className="flex gap-3">
                                  <img src={comment.userAvatar || undefined} alt={comment.userName} className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                                  <div className="flex-1">
                                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                      <p className="text-sm font-bold text-slate-900">{comment.userName}</p>
                                      <p className="text-sm text-slate-700">{comment.content}</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 ml-2">
                                      {comment.date && !isNaN(new Date(comment.date).getTime()) ? formatDistanceToNow(new Date(comment.date), { addSuffix: true, locale: vi }) : 'Vừa xong'}
                                    </p>
                                  </div>
                                </div>
                              ))}

                              {showCommentInput === post.id && (
                                <div className="flex gap-3 pt-2">
                                  <img src={currentUser?.avatar || undefined} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                                  <div className="flex-1 flex gap-2">
                                    <input 
                                      type="text"
                                      placeholder="Viết bình luận..."
                                      className="flex-1 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                    />
                                    <Button 
                                      size="sm" 
                                      className="rounded-full w-8 h-8 p-0 flex items-center justify-center bg-red-600"
                                      onClick={() => handleAddComment(post.id)}
                                    >
                                      <Send className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )})}
                </AnimatePresence>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Emergency Calls */}
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-red-50 bg-red-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Cần máu khẩn cấp
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                </div>
                <div className="p-4 space-y-4">
                  {emergencyCalls.filter(call => call.status === 'active').map((call, index) => (
                    <div key={`${call.id}-${index}`} className="p-4 rounded-xl border border-red-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">
                          Nhóm {call.bloodGroup}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(call.date), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 mb-2">{call.message}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{call.hospitalName}</span>
                      </div>
                      <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                        Hỗ trợ ngay
                      </Button>
                    </div>
                  ))}
                  {emergencyCalls.filter(call => call.status === 'active').length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">Hiện không có ca cần máu khẩn cấp.</p>
                  )}
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Hoạt động vừa diễn ra
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={`${activity.id}-${index}`} className="flex gap-3 items-center">
                      <img src={activity.imageUrl || undefined} alt={activity.title} className="w-12 h-12 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{activity.title}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" />
                          {activity.registered} người tham gia
                        </p>
                      </div>
                    </div>
                  ))}
                  <Link to="/events" className="block text-center text-sm text-blue-600 font-medium hover:underline pt-2">
                    Xem tất cả <ChevronRight className="w-4 h-4 inline" />
                  </Link>
                </div>
              </div>

              {/* Top Contributors */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Người đóng góp tích cực
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {users.filter(u => u.role === 'donor').sort((a, b) => b.donationsCount - a.donationsCount).slice(0, 3).map((user, index) => (
                    <div key={`${user.id}-${index}`} className="flex items-center gap-3">
                      <div className="relative">
                        <img src={user.avatar || undefined} alt={user.name} className="w-10 h-10 rounded-full bg-slate-100" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-amber-600">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-900">{user.name}</h4>
                        <p className="text-xs text-slate-500">{user.donationsCount} lần hiến máu</p>
                      </div>
                      <div className="text-sm font-bold text-red-600">
                        +{user.points}đ
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="challenges">
          <ChallengesSection />
        </TabsContent>

        <TabsContent value="minigame">
          <MiniGameTab />
        </TabsContent>

        <TabsContent value="map">
          <DonorMapSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};