import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { Trash2, Pin, Edit2, Search, GripVertical, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';

export const AdminPosts: React.FC = () => {
  const { currentUser, communityPosts, deleteCommunityPost, pinCommunityPost, updateCommunityPost, addCommunityPost, reorderCommunityPosts } = useApp();
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageUrls, setEditImageUrls] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'normal'>('all');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [postType, setPostType] = useState<'experience' | 'story' | 'achievement'>('experience');
  const [imageUrls, setImageUrls] = useState('');

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    addCommunityPost({
      title: newPostTitle,
      content: newPostContent,
      type: postType,
      userId: currentUser?.id || 'admin',
      isPinned: isPinned,
      imageUrls: imageUrls.split(',').map(url => url.trim()).filter(Boolean),
    });
    setNewPostTitle('');
    setNewPostContent('');
    setImageUrls('');
    setIsPinned(false);
    toast.success('Đã đăng bài viết');
  };

  const handleEditPost = (post: any) => {
    setEditingPostId(post.id);
    setEditTitle(post.title || '');
    setEditContent(post.content);
    setEditImageUrls(post.imageUrls ? post.imageUrls.join(', ') : '');
  };

  const handleSaveEdit = (postId: string) => {
  const imageUrls = (editImageUrls || '')
    .split(',')
    .map(url => url.trim())
    .filter((url): url is string => url.length > 0);

  updateCommunityPost(postId, editTitle, editContent, imageUrls);

  setEditingPostId(null);
  setEditTitle('');
  setEditContent('');
  setEditImageUrls('');
};

  const filteredPosts = communityPosts
    .filter(post => 
      post.userId === currentUser?.id &&
      (post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.userName.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filter === 'all' || (filter === 'pinned' ? post.isPinned : !post.isPinned))
    )
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;

    const draggedPost = filteredPosts[sourceIndex];
    const targetPost = filteredPosts[destinationIndex];

    reorderCommunityPosts(draggedPost.id, targetPost.id);
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: 40% Form */}
      <div className="col-span-12 lg:col-span-5">
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-lg sticky top-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Đăng bài viết mới</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="Tiêu đề..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-red-500 outline-none"
              />
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-3">
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} id="pin" className="h-4 w-4 text-red-600 rounded" />
                <label htmlFor="pin" className="text-sm text-slate-700 flex items-center gap-1">
                  <Pin className="w-4 h-4" /> Ghim bài
                </label>
              </div>
            </div>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Nội dung..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-red-500 outline-none resize-none min-h-[140px]"
              rows={4}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                type="text"
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
                placeholder="URL ảnh (cách nhau bằng dấu phẩy)..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-red-500 outline-none"
              />
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as any)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-red-500 outline-none"
              >
                <option value="experience">Trải nghiệm</option>
                <option value="story">Câu chuyện</option>
                <option value="achievement">Thành tích</option>
              </select>
            </div>
            <Button className="w-full" onClick={handleCreatePost}>Đăng bài</Button>
          </div>
        </div>
      </div>

      {/* Right: 60% List */}
      <div className="col-span-12 lg:col-span-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Quản lý bài viết</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-red-500 outline-none"
              />
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="p-2 rounded-lg border border-slate-200">
              <option value="all">Tất cả</option>
              <option value="pinned">Bài ghim</option>
              <option value="normal">Bài thường</option>
            </select>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="admin-posts">
            {(provided) => (
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <p className="text-slate-500">Chưa có bài viết nào của quản trị viên.</p>
                  </div>
                ) : (
                  filteredPosts.map((post, index) => (
                    <Draggable key={post.id} draggableId={post.id} index={index} isDragDisabled={!post.isPinned}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white p-5 rounded-[28px] border shadow-sm transition-all overflow-hidden ${post.isPinned ? 'border-red-500 ring-1 ring-red-500 bg-red-50/40' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'} ${snapshot.isDragging ? 'opacity-80 scale-[1.01] z-50 shadow-xl' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {post.isPinned && <span className="flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200"><Pin className="w-3.5 h-3.5" /> Đã ghim</span>}
                                    <h3 className="font-bold text-slate-900 text-lg">{post.title || 'Không tiêu đề'}</h3>
                                  </div>
                                  <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(post.date), { addSuffix: true, locale: vi })}</p>
                                </div>
                                {post.isPinned && (
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
                                    title="Kéo để sắp xếp"
                                  >
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              {editingPostId === post.id ? (
                                <div className="space-y-3 mt-1">
                                  <input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:border-red-500 outline-none"
                                    placeholder="Tiêu đề..."
                                  />
                                  <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:border-red-500 outline-none min-h-[120px]"
                                    rows={3}
                                    placeholder="Nội dung..."
                                  />
                                  <input
                                    value={editImageUrls}
                                    onChange={(e) => setEditImageUrls(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:border-red-500 outline-none"
                                    placeholder="URL ảnh (cách nhau bằng dấu phẩy)..."
                                  />
                                </div>
                              ) : (
                                <p className="text-slate-600 text-sm whitespace-pre-wrap break-words max-h-28 overflow-hidden">{post.content}</p>
                              )}
                              {post.imageUrls && post.imageUrls.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 gap-2 overflow-hidden">
                                  {post.imageUrls.map((url, idx) => (
                                    <img key={idx} src={url} alt="Post attachment" className="h-24 w-full object-cover rounded-xl border border-slate-200" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-xs text-slate-400">{post.userName}</p>
                              {editingPostId === post.id ? (
                                <Button size="sm" onClick={() => handleSaveEdit(post.id)}>Lưu</Button>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  <button onClick={() => pinCommunityPost(post.id)} className={`px-3 py-2 rounded-xl transition-all ${post.isPinned ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} title={post.isPinned ? "Bỏ ghim" : "Ghim bài"}>
                                    <Pin className="w-4 h-4 inline-block" />
                                  </button>
                                  <button onClick={() => handleEditPost(post)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all" title="Sửa bài">
                                    <Edit2 className="w-4 h-4 inline-block" />
                                  </button>
                                  <button onClick={() => deleteCommunityPost(post.id)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700 transition-all" title="Xóa bài">
                                    <Trash2 className="w-4 h-4 inline-block" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};