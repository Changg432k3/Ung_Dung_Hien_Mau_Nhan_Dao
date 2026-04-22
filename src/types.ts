export interface Post {
  id: string;
  title: string;
  coverImage: string;
  content: string;
  description: string;
  category: 'news' | 'health' | 'urgent' | 'stories';
  status: 'published' | 'draft' | 'hidden';
  publishDate: string;
  publishAt?: string; // For scheduling
  isFeatured: boolean;
  viewCount: number;
  clickCount: number;
  authorId: string;
  createdAt: string;
  tags: string[];
  deleted: boolean; // For trash
}
