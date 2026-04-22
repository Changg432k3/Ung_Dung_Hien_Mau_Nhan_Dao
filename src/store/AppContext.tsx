import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format, parseISO, addMonths, isAfter, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import { auth, db } from '../lib/firebase';
import { signOut, onAuthStateChanged, updatePassword } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, onSnapshot, where, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  throw new Error(JSON.stringify(errInfo));
}

export type UserRole = 'donor' | 'admin' | 'staff' | 'organizer';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Chưa xác định';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bloodGroup?: BloodGroup;
  points: number;
  donationsCount: number;
  lastDonationDate?: string;
  avatar?: string;
  seenBadges?: string[];
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  isLocked?: boolean;
  medicalInfo?: string;
  isRegularDonor?: boolean;
  lastReminderDate?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  interestedEvents?: string[];
  joinedChallenges?: string[];
  completedChallenges?: string[];
  gameLevel?: number;
  dailyStreak?: number;
  lastGamePlayDate?: string;
  correctAnswersCount?: number;
  maxConsecutiveCorrect?: number;
  consecutiveCorrect?: number;
  earnedBadges?: { badgeId: string; dateAwarded: string }[];
}

export interface Event {
  id: string;
  title: string;
  date: string;
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  locationId?: string;
  address: string;
  lat: number;
  lng: number;
  organizer: string;
  target: number;
  registered: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  category: 'routine' | 'urgent' | 'special';
  description: string;
  imageUrl?: string;
  region?: string;
  neededBloodTypes?: BloodGroup[];
  schedule?: { id: string; time: string; activity: string }[];
}

export interface DonationRecord {
  id: string;
  userId: string;
  eventId: string;
  date: string;
  amount: number; // ml (actual amount donated)
  expectedAmount?: number; // ml (expected amount to donate)
  status: 'registered' | 'checked-in' | 'completed' | 'cancelled';
  bloodGroup: BloodGroup;
  giftReceived?: boolean;
  giftType?: string;
  giftReceivedDate?: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl: string;
  type: 'voucher' | 'gift' | 'badge';
  stock: number;
  category: 'shirt' | 'badge' | 'voucher' | 'souvenir';
  conditionType: 'donations' | 'points' | 'event' | 'none';
  conditionValue: number | string;
  expirationDate?: string;
  usageLimit?: number;
  isActive: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  condition: number;
  icon: string;
  colorTheme?: string;
  conditionType?: 'donations' | 'events' | 'referrals' | 'active_time';
  logicType?: 'auto' | 'manual' | 'event_based';
  status?: 'active' | 'inactive';
  visibility?: 'public' | 'hidden';
  lockedIcon?: string;
  unlockedIcon?: string;
  animation?: string;
}

export interface RedeemedReward {
  id: string;
  userId: string;
  rewardId: string;
  date: string;
  voucherCode?: string;
  isUsed: boolean;
  usedAt?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  backgroundUrl: string;
  title: string;
  content: string;
  signatureUrl: string;
  logoUrl?: string;
  signerName?: string;
  signerTitle?: string;
  stampUrl?: string;
  enableQR?: boolean;
  status?: 'active' | 'hidden';
  fontStyle?: string;
  eventId?: string; // Specific event this template is for
  minDonations?: number; // Minimum donations required to get this template
  icon?: string;
  color?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  eventId: string;
  recordId: string;
  templateId: string;
  issueDate: string;
  pdfUrl?: string;
  qrCode?: string;
  status?: 'issued' | 'revoked';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'event_new' | 'event_update' | 'reminder' | 'emergency';
  date: string;
  isRead: boolean;
  link?: string;
  bloodGroup?: BloodGroup;
}

export interface CommunityComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  date: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: UserRole;
  title?: string;
  content: string;
  type: 'experience' | 'story' | 'achievement';
  imageUrl?: string;
  imageUrls?: string[]; // Added support for multiple images
  badgeId?: string;
  likes: string[]; // userIds
  comments: CommunityComment[];
  date: string;
  status?: 'pending' | 'approved' | 'rejected';
  isPinned?: boolean;
}

export interface EmergencyCall {
  id: string;
  bloodGroup: BloodGroup;
  location: string;
  message: string;
  hospitalName: string;
  date: string;
  status: 'active' | 'resolved';
}

export interface Review {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  eventId: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  rewardPoints: number;
  rewardBadgeId?: string;
  targetDonations: number;
  imageUrl: string;
  participants: string[]; // userIds
}

export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
  category: 'health' | 'blood_donation' | 'general';
}

export interface UserQuizAttempt {
  userId: string;
  quizId: string;
  isCorrect: boolean;
  date: string;
}

interface AppContextType {
  currentUser: User | null;
  login: (role: UserRole, googleUser?: any, userData?: any) => void;
  logout: () => void;
  events: Event[];
  records: DonationRecord[];
  rewards: Reward[];
  redeemedRewards: RedeemedReward[];
  users: User[];
  reviews: Review[];
  updateUser: (id: string, userData: Partial<User>) => void;
  registerForEvent: (eventId: string, expectedAmount?: number) => Promise<{ success: boolean; message?: string }>;
  cancelRegistration: (recordId: string) => void;
  checkInUser: (recordId: string) => void;
  completeDonation: (recordId: string, amount: number, bloodGroup: BloodGroup) => void;
  addEvent: (event: Omit<Event, 'id' | 'registered' | 'status'>) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  updateReview: (id: string, review: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  markBadgeAsSeen: (badgeLevel: string) => void;
  redeemReward: (rewardId: string) => { success: boolean; message?: string; voucherCode?: string };
  userLocation: { lat: number; lng: number } | null;
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  badges: Badge[];
  addBadge: (badge: Omit<Badge, 'id'>) => void;
  updateBadge: (id: string, badge: Partial<Badge>) => void;
  deleteBadge: (id: string) => void;
  addReward: (reward: Omit<Reward, 'id'>) => void;
  updateReward: (id: string, reward: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  certificateTemplates: CertificateTemplate[];
  addCertificateTemplate: (template: Omit<CertificateTemplate, 'id'>) => void;
  updateCertificateTemplate: (id: string, template: Partial<CertificateTemplate>) => void;
  deleteCertificateTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  toggleTemplateStatus: (id: string) => void;
  certificates: Certificate[];
  issueCertificate: (userId: string, eventId: string, recordId: string) => void;
  revokeCertificate: (id: string) => void;
  regenerateCertificate: (id: string) => void;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'isRead'>) => void;
  toggleInterestedEvent: (eventId: string) => void;
  receiveGift: (recordId: string, giftType: string | string[]) => void;
  communityPosts: CommunityPost[];
  addCommunityPost: (post: Omit<CommunityPost, 'id' | 'date' | 'likes' | 'comments' | 'userName' | 'userAvatar'>) => void;
  deleteCommunityPost: (postId: string) => void;
  updateCommunityPost: (postId: string, title: string, content: string, imageUrls: string[]) => void;
  pinCommunityPost: (postId: string) => void;
  reorderCommunityPosts: (sourceId: string, destinationId: string) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  emergencyCalls: EmergencyCall[];
  addEmergencyCall: (call: Omit<EmergencyCall, 'id' | 'date' | 'status'>) => void;
  resolveEmergencyCall: (id: string) => void;
  challenges: Challenge[];
  joinChallenge: (challengeId: string) => void;
  leaveChallenge: (challengeId: string) => void;
  quizzes: Quiz[];
  submitQuizAnswer: (quizId: string, answerIndex: number) => Promise<{ success: boolean; message: string; pointsEarned: number }>;
  spinWheel: () => { success: boolean; message: string; prize?: string; points?: number };
  userQuizAttempts: UserQuizAttempt[];
  locations: Location[];
  rolePermissions: Record<UserRole, string[]>;
  updateRolePermissions: (role: UserRole, permissions: string[]) => void;
  changePassword: (newPassword: string) => Promise<void>;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  contactInfo?: string;
  type: 'hospital' | 'center' | 'mobile';
  imageUrl?: string;
  createdAt: string;
}

import { MOCK_REWARDS } from './MOCK_REWARDS';

const MOCK_REDEEMED_REWARDS: RedeemedReward[] = [];

const MOCK_BADGES: Badge[] = [
  // Bronze Level (15 badges)
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `b_bronze_${i + 1}`,
    name: `Huy hiệu Đồng ${i + 1}`,
    description: `Đã hiến máu ${3 + i * 2} lần`,
    level: 'Bronze' as const,
    condition: 3 + i * 2,
    icon: 'Award'
  })),
  // Silver Level (15 badges)
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `b_silver_${i + 1}`,
    name: `Huy hiệu Bạc ${i + 1}`,
    description: `Đã hiến máu ${20 + i * 5} lần`,
    level: 'Silver' as const,
    condition: 20 + i * 5,
    icon: 'Award'
  })),
  // Gold Level (15 badges)
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `b_gold_${i + 1}`,
    name: `Huy hiệu Vàng ${i + 1}`,
    description: `Đã hiến máu ${50 + i * 10} lần`,
    level: 'Gold' as const,
    condition: 50 + i * 10,
    icon: 'Award'
  })),
  { id: 'b_quiz', name: 'Bậc thầy kiến thức', description: 'Hoàn thành tất cả câu hỏi đố vui', level: 'Gold', condition: 0, icon: 'Brain' },
  { id: 'b_knowledge', name: 'Người hiểu biết', description: 'Trả lời đúng 10 câu hỏi', level: 'Bronze', condition: 10, icon: 'BookOpen' },
  { id: 'b_expert', name: 'Chuyên gia hiến máu', description: 'Trả lời đúng 50 câu hỏi', level: 'Silver', condition: 50, icon: 'Trophy' },
  { id: 'b_intellect', name: 'Siêu trí tuệ', description: 'Đúng 10 câu liên tiếp', level: 'Gold', condition: 10, icon: 'Zap' },
];

const MOCK_CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'ct_nhahaotam',
    name: 'Nhà hảo tâm',
    backgroundUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop',
    title: 'GIẤY CHỨNG NHẬN NHÀ HẢO TÂM',
    content: 'Chứng nhận ông/bà [Tên người hiến] đã có đóng góp to lớn trong phong trào hiến máu tình nguyện. Nghĩa cử cao đẹp của bạn đã góp phần cứu sống nhiều người bệnh.',
    signatureUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/John_Hancock_signature.png',
    icon: 'Heart',
    color: 'red'
  },
  {
    id: 'ct_tichcuc',
    name: 'Người hiến máu tích cực',
    backgroundUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop',
    title: 'GIẤY CHỨNG NHẬN NGƯỜI HIẾN MÁU TÍCH CỰC',
    content: 'Chứng nhận ông/bà [Tên người hiến] đã tích cực tham gia hiến máu nhiều lần. Sự kiên trì và lòng nhân ái của bạn là tấm gương sáng cho cộng đồng.',
    signatureUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/John_Hancock_signature.png',
    icon: 'Activity',
    color: 'orange'
  },
  {
    id: 'ct_landau',
    name: 'Người hiến máu lần đầu',
    backgroundUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop',
    title: 'GIẤY CHỨNG NHẬN NGƯỜI HIẾN MÁU LẦN ĐẦU',
    content: 'Chứng nhận ông/bà [Tên người hiến] đã dũng cảm tham gia hiến máu lần đầu tiên. Chào mừng bạn đến với cộng đồng những người hiến máu tình nguyện.',
    signatureUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/John_Hancock_signature.png',
    icon: 'Star',
    color: 'yellow'
  },
  {
    id: 'ct_khancap',
    name: 'Người hiến máu khẩn cấp',
    backgroundUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop',
    title: 'GIẤY CHỨNG NHẬN NGƯỜI HIẾN MÁU KHẨN CẤP',
    content: 'Chứng nhận ông/bà [Tên người hiến] đã kịp thời tham gia hiến máu khẩn cấp, cứu sống bệnh nhân trong cơn nguy kịch. Vô cùng biết ơn hành động kịp thời của bạn.',
    signatureUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/John_Hancock_signature.png',
    icon: 'Zap',
    color: 'purple'
  },
  {
    id: 'ct_tinhnguyen',
    name: 'Tình nguyện viên',
    backgroundUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop',
    title: 'GIẤY CHỨNG NHẬN TÌNH NGUYỆN VIÊN',
    content: 'Chứng nhận ông/bà [Tên người hiến] đã tích cực hỗ trợ tổ chức các sự kiện hiến máu tình nguyện. Sự đóng góp thầm lặng của bạn giúp các sự kiện diễn ra thành công tốt đẹp.',
    signatureUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/John_Hancock_signature.png',
    icon: 'Users',
    color: 'green'
  },
  {
    id: 'ct_qtv',
    name: 'QTV tích cực',
    backgroundUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop',
    title: 'GIẤY CHỨNG NHẬN QUẢN TRỊ VIÊN TÍCH CỰC',
    content: 'Chứng nhận ông/bà [Tên người hiến] đã hoàn thành xuất sắc vai trò quản trị viên, góp phần phát triển cộng đồng hiến máu vững mạnh.',
    signatureUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/John_Hancock_signature.png',
    icon: 'Shield',
    color: 'blue'
  }
];

const MOCK_CERTIFICATES: Certificate[] = [];

const MOCK_USERS_LIST: User[] = [
  {
    id: 'u1',
    name: 'Nguyễn Văn A',
    email: 'nva@gmail.com',
    role: 'donor',
    bloodGroup: 'O+',
    points: 150,
    donationsCount: 3,
    lastDonationDate: '2023-10-15',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    seenBadges: ['Bronze'],
    phone: '0901234567',
    address: 'Quận 1, TP. Hồ Chí Minh',
    isLocked: false,
    medicalInfo: 'Sức khỏe tốt, không có bệnh nền.',
    isRegularDonor: true,
    birthDate: '1995-05-20',
    gender: 'male',
    lat: 10.7825,
    lng: 106.6975,
    joinedChallenges: ['ch1', 'ch2'],
    completedChallenges: []
  },
  {
    id: 'u2',
    name: 'Trần Thị B',
    email: 'ttb@gmail.com',
    role: 'donor',
    bloodGroup: 'A+',
    points: 50,
    donationsCount: 1,
    lastDonationDate: '2024-01-10',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha',
    seenBadges: [],
    phone: '0912345678',
    address: 'Quận 3, TP. Hồ Chí Minh',
    lat: 10.7812,
    lng: 106.6854,
    isLocked: false,
    medicalInfo: 'Dị ứng phấn hoa nhẹ.',
    isRegularDonor: false,
    birthDate: '1998-11-12',
    gender: 'female',
    joinedChallenges: ['ch1'],
    completedChallenges: []
  },
  {
    id: 'u3',
    name: 'Lê Văn C',
    email: 'lvc@gmail.com',
    role: 'donor',
    bloodGroup: 'B-',
    points: 300,
    donationsCount: 6,
    lastDonationDate: '2023-12-05',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb',
    seenBadges: ['Bronze', 'Silver'],
    phone: '0987654321',
    address: 'Quận 7, TP. Hồ Chí Minh',
    lat: 10.7578,
    lng: 106.6583,
    isLocked: true,
    medicalInfo: 'Đang trong thời gian theo dõi sau phẫu thuật nhẹ.',
    isRegularDonor: true,
    birthDate: '1990-02-28',
    gender: 'male',
    joinedChallenges: [],
    completedChallenges: []
  }
];

const MOCK_USERS: Record<UserRole, User> = {
  donor: MOCK_USERS_LIST[0],
  admin: {
    id: 'a1',
    name: 'Quản trị viên',
    email: 'admin@mau+.vn',
    role: 'admin',
    points: 0,
    donationsCount: 0,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    seenBadges: [],
    phone: '0999999999',
    address: 'Hà Nội',
    isLocked: false,
    medicalInfo: '',
    isRegularDonor: false,
    birthDate: '1980-01-01',
    gender: 'male',
    joinedChallenges: [],
    completedChallenges: []
  },
  staff: { 
    id: 's1', 
    name: 'Nhân viên y tế', 
    email: 'staff@hospital.com',
    role: 'staff', 
    points: 0,
    donationsCount: 0,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Staff',
    seenBadges: [],
    phone: '0888888888',
    address: 'Hà Nội',
    isLocked: false,
    medicalInfo: '',
    isRegularDonor: false,
    birthDate: '1990-01-01',
    gender: 'female',
    joinedChallenges: [],
    completedChallenges: []
  },
  organizer: { 
    id: 'o1', 
    name: 'Đơn vị tổ chức', 
    email: 'organizer@hospital.com',
    role: 'organizer', 
    points: 0,
    donationsCount: 0,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Organizer',
    seenBadges: [],
    phone: '0777777777',
    address: 'Hà Nội',
    isLocked: false,
    medicalInfo: '',
    isRegularDonor: false,
    birthDate: '1985-01-01',
    gender: 'male',
    joinedChallenges: [],
    completedChallenges: []
  }
};

const MOCK_EVENTS: Event[] = Array.from({ length: 20 }, (_, i) => ({
  id: `e${i + 1}`,
  title: `Sự kiện hiến máu ${i + 1} - ${['Ngày hội', 'Chủ nhật Đỏ', 'Xuân Hồng', 'Giọt hồng', 'Trái tim nhân ái'][i % 5]}`,
  date: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
  startDate: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
  endDate: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
  time: '07:00 - 17:00',
  location: `Địa điểm ${i + 1}`,
  address: `${(i + 1) * 10} Đường ABC, Quận ${ (i % 12) + 1}, TP.HCM`,
  lat: 10.75 + (i * 0.01),
  lng: 106.65 + (i * 0.01),
  organizer: `Tổ chức ${['Hội Chữ thập đỏ', 'Báo Tiền Phong', 'Đoàn Thanh niên', 'Bệnh viện Chợ Rẫy', 'Đại học Bách Khoa'][i % 5]}`,
  target: 100 + i * 50,
  registered: Math.floor(Math.random() * (100 + i * 50)),
  status: i < 5 ? 'completed' : 'upcoming',
  category: ['routine', 'special', 'urgent'][i % 3] as 'routine' | 'special' | 'urgent',
  description: `Mô tả chi tiết cho sự kiện hiến máu số ${i + 1}. Đây là một sự kiện quan trọng nhằm kêu gọi cộng đồng tham gia hiến máu cứu người.`,
  imageUrl: `https://picsum.photos/seed/e${i + 1}/600/400`,
  region: 'TP. Hồ Chí Minh',
  neededBloodTypes: ['A+', 'O+', 'B+', 'AB+']
}));

const MOCK_RECORDS: DonationRecord[] = [
  {
    id: 'r1',
    userId: 'u1',
    eventId: 'e3',
    date: '2024-03-05',
    amount: 350,
    status: 'completed',
    bloodGroup: 'O+'
  },
  {
    id: 'r2',
    userId: 'u1',
    eventId: 'e1',
    date: '2024-03-15',
    amount: 0,
    status: 'registered',
    bloodGroup: 'O+'
  },
  {
    id: 'r3',
    userId: 'u1',
    eventId: 'e8',
    date: '2026-03-02',
    amount: 0,
    status: 'registered',
    bloodGroup: 'O+'
  }
];

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    userId: 'u1',
    title: 'Cần nhóm máu O khẩn cấp',
    message: 'Bệnh viện Chợ Rẫy đang thiếu hụt nhóm máu O+. Hãy tham gia hiến máu ngay nếu bạn có thể.',
    type: 'emergency',
    date: new Date().toISOString(),
    isRead: false,
    bloodGroup: 'O+'
  },
  {
    id: 'n2',
    userId: 'u1',
    title: 'Sự kiện mới: Ngày hội Xuân Hồng',
    message: 'Một sự kiện hiến máu mới vừa được tổ chức tại Quận 1. Đăng ký tham gia ngay!',
    type: 'event_new',
    date: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
    link: '/events/e1'
  }
];

const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev1',
    userId: 'u2',
    eventId: 'e3',
    rating: 5,
    comment: 'Tổ chức rất chuyên nghiệp, bác sĩ nhiệt tình. Cảm ơn chương trình!',
    date: '2024-03-06T10:00:00Z'
  },
  {
    id: 'rev2',
    userId: 'u3',
    eventId: 'e6',
    rating: 4,
    comment: 'Sự kiện đông người nhưng sắp xếp khá ổn. Sẽ tiếp tục tham gia.',
    date: '2024-03-11T14:30:00Z'
  }
];

const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    userId: 'u1',
    userName: 'Nguyễn Văn A',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    content: 'Hôm nay mình vừa tham gia hiến máu tại Nhà văn hóa Thanh Niên. Cảm giác thật tuyệt vời khi biết giọt máu của mình có thể giúp ích cho ai đó! ❤️',
    type: 'experience',
    imageUrl: 'https://picsum.photos/seed/p1/800/600',
    likes: ['u2', 'u3'],
    comments: [
      {
        id: 'c1',
        userId: 'u2',
        userName: 'Trần Thị B',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha',
        content: 'Tuyệt vời quá anh ơi! Em cũng định đăng ký tuần tới nè.',
        date: '2024-03-15T10:30:00Z'
      }
    ],
    date: '2024-03-15T09:00:00Z'
  },
  {
    id: 'p2',
    userId: 'u3',
    userName: 'Lê Văn C',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb',
    content: 'Mình đã đạt được Huy hiệu Bạc sau 5 lần hiến máu. Cảm ơn Mau+ đã tạo ra sân chơi ý nghĩa này!',
    type: 'achievement',
    badgeId: 'b2',
    likes: ['u1'],
    comments: [],
    date: '2024-03-12T15:00:00Z'
  },
  {
    id: 'p3',
    userId: 'u2',
    userName: 'Trần Thị B',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha',
    content: 'Câu chuyện về bác Hùng, người đã hiến máu hơn 50 lần, thực sự làm mình xúc động. Bác là tấm gương sáng cho thế hệ trẻ noi theo.',
    type: 'story',
    likes: ['u1', 'u3'],
    comments: [],
    date: '2024-03-10T08:00:00Z'
  }
];

const MOCK_EMERGENCY_CALLS: EmergencyCall[] = [
  {
    id: 'ec1',
    bloodGroup: 'O-',
    location: 'Bệnh viện Chợ Rẫy',
    hospitalName: 'Bệnh viện Chợ Rẫy',
    message: 'Cần gấp 2 đơn vị máu nhóm O- cho ca phẫu thuật tim cấp cứu.',
    date: new Date().toISOString(),
    status: 'active'
  },
  {
    id: 'ec2',
    bloodGroup: 'AB-',
    location: 'Bệnh viện Truyền máu Huyết học',
    hospitalName: 'Bệnh viện Truyền máu Huyết học',
    message: 'Nhóm máu AB- đang cạn kiệt, rất mong các tình nguyện viên hỗ trợ.',
    date: new Date(Date.now() - 172800000).toISOString(),
    status: 'active'
  }
];

const MOCK_CHALLENGES: Challenge[] = [
  // {
  //   id: 'ch3', // ID duy nhất cho thử thách
  //   title: 'Tên thử thách của bạn',
  //   description: 'Mô tả chi tiết về thử thách.',
  //   startDate: '2026-05-01', // Ngày bắt đầu
  //   endDate: '2026-05-31',   // Ngày kết thúc
  //   rewardPoints: 200,       // Điểm thưởng
  //   targetDonations: 1,      // Số lần hiến máu mục tiêu
  //   imageUrl: 'URL_ẢNH_CỦA_BẠN', // Link ảnh
  //   participants: []         // Danh sách ID người tham gia (để trống)
  // },
  {
    id: 'ch1',
    title: 'Tháng hiến máu nhân đạo',
    description: 'Tham gia hiến máu ít nhất 1 lần trong tháng 3 để nhận huy hiệu đặc biệt và 100 điểm thưởng.',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    rewardPoints: 100,
    rewardBadgeId: 'b1',
    targetDonations: 1,
    imageUrl: 'https://ums.vnu.edu.vn/files/uploads/2024/02/123123.jpg',
    participants: ['u1', 'u2']
  },
  {
    id: 'ch2',
    title: 'Chiến binh hiến máu',
    description: 'Hoàn thành 3 lần hiến máu trong năm 2026 để nhận 500 điểm thưởng.',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    rewardPoints: 500,
    targetDonations: 3,
    imageUrl: 'https://vienhuyethoc.vn/wp-content/uploads/2022/10/75D8A6FC-288C-4CE3-82B7-EFCF9D8986A2.jpeg',
    participants: ['u1']
  },
  // 🟢 DỄ (đang diễn ra tháng 4/2026)
  {
    id: 'ch3',
    title: 'Giọt máu tháng 4',
    description: 'Hoàn thành 1 lần hiến máu trong tháng 4/2026 để nhận 150 điểm thưởng.',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    rewardPoints: 150,
    targetDonations: 1,
    imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=800&auto=format&fit=crop',
    participants: []
  },
  {
    id: 'ch4',
    title: 'Lan tỏa yêu thương',
    description: 'Hiến máu 1 lần trong tháng này để góp phần cứu người và nhận 180 điểm.',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    rewardPoints: 180,
    targetDonations: 1,
    imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=800&auto=format&fit=crop',
    participants: []
  },

  // 🟡 TRUNG BÌNH
  {
    id: 'ch5',
    title: 'Người hùng cộng đồng',
    description: 'Hoàn thành 2 lần hiến máu từ tháng 4 đến tháng 6/2026 để nhận 350 điểm.',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    rewardPoints: 350,
    targetDonations: 2,
    imageUrl: 'https://media.baohungyen.vn/upload/image/202601/medium/108879_hon_600_nguoi_tham_gia_ngay_hoi_hien_mau_tinh_nguyen_tai_truong_dai_hoc_tai_chinh_quan_tri_kinh_doanh_20424128.jpg',
    participants: []
  },
  {
    id: 'ch6',
    title: 'Kết nối sự sống',
    description: 'Hiến máu 2 lần trong mùa hè sớm để trở thành đại sứ cộng đồng.',
    startDate: '2026-04-15',
    endDate: '2026-07-31',
    rewardPoints: 400,
    targetDonations: 2,
    imageUrl: 'https://phongkhamdaiphuoc.vn/vnt_upload/news/11_2025/hien_mau_tinh_nguyen.webp',
    participants: []
  },
  {
    id: 'ch7',
    title: 'Sứ mệnh nhân ái',
    description: 'Hoàn thành 2 lần hiến máu trong năm 2026 để nhận 420 điểm thưởng.',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    rewardPoints: 420,
    targetDonations: 2,
    imageUrl: 'https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2021/2/12/879963/Hien-Mau-10.jpg',
    participants: []
  },

  // 🔴 KHÓ
  {
    id: 'ch8',
    title: 'Chiến thần hiến máu',
    description: 'Hoàn thành 4 lần hiến máu trong năm 2026 để nhận 800 điểm thưởng.',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    rewardPoints: 800,
    targetDonations: 4,
    imageUrl: 'https://bvnguyentriphuong.com.vn/uploads2025/userfiles/39/images/Tin%20t%E1%BB%AB%20c%C3%A1c%20c%C6%A1%20s%E1%BB%9F%20y%20t%E1%BA%BF/hien-mau.jpg',
    participants: []
  },
  {
    id: 'ch9',
    title: 'Huyền thoại máu nóng',
    description: 'Hiến máu 5 lần trong năm để mở khóa danh hiệu giới hạn.',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    rewardPoints: 1000,
    targetDonations: 5,
    imageUrl: 'https://benhviennhitrunguong.gov.vn/wp-content/uploads/2025/04/Huong-ung-ngay-toan-dan-hien-mau-tinh-nguyen_web-650.jpg',
    participants: []
  },

  // 🏆 EVENT ĐẶC BIỆT
  {
    id: 'ch10',
    title: 'Chuẩn bị Ngày hội 14/06',
    description: 'Tham gia hiến máu từ nay đến trước ngày 14/06 để nhận thưởng sớm 600 điểm.',
    startDate: '2026-04-10',
    endDate: '2026-06-13',
    rewardPoints: 600,
    targetDonations: 1,
    imageUrl: 'https://dongnaicdc.vn/UserFiles/Images/2022/Thang%203/lan%20toa1.JPG',
    participants: []
  },
  {
    id: 'ch11',
    title: 'Mùa hè sẻ chia',
    description: 'Hiến máu trong chiến dịch đầu hè 2026 để nhận 650 điểm thưởng.',
    startDate: '2026-04-15',
    endDate: '2026-05-31',
    rewardPoints: 650,
    targetDonations: 1,
    imageUrl: 'https://home.cdn.papaya.services/dieu_kien_hien_mau_1_6415398a9c.jpg',
    participants: []
  },
  {
    id: 'ch12',
    title: 'Tháng vàng hiến máu',
    description: 'Thử thách đặc biệt đang mở: hoàn thành 2 lần hiến máu từ tháng 4 đến tháng 7.',
    startDate: '2026-04-01',
    endDate: '2026-07-31',
    rewardPoints: 900,
    targetDonations: 2,
    imageUrl: 'https://cdn.tiemchunglongchau.com.vn/hien_mau_co_tot_khong_loi_ich_va_nhung_dieu_can_biet_de_dam_bao_an_toan_1_ddf0ab8447.png',
    participants: []
  }

];

const MOCK_QUIZZES: Quiz[] = [
  {
    id: 'q1',
    question: 'Bệnh Thalassemia (tan máu bẩm sinh) là do nguyên nhân nào?',
    options: ['Do vi khuẩn', 'Do di truyền từ cha mẹ', 'Do thiếu ngủ', 'Do ăn uống không vệ sinh'],
    correctAnswer: 1,
    explanation: 'Thalassemia là một bệnh máu di truyền. Bệnh do sự thiếu hụt tổng hợp một chuỗi globin trong huyết sắc tố của hồng cầu.',
    points: 20,
    category: 'health'
  },
  {
    id: 'q2',
    question: 'Triệu chứng điển hình của bệnh thiếu máu là gì?',
    options: ['Mệt mỏi, da xanh xao, hoa mắt', 'Đau bụng dữ dội', 'Sốt cao co giật', 'Ngứa ngoài da'],
    correctAnswer: 0,
    explanation: 'Thiếu máu làm giảm khả năng vận chuyển oxy của máu, dẫn đến các triệu chứng như mệt mỏi, yếu sức, da niêm mạc xanh xao.',
    points: 20,
    category: 'health'
  },
  {
    id: 'q3',
    question: 'Bệnh máu khó đông (Hemophilia) thường gặp ở giới tính nào nhiều hơn?',
    options: ['Nữ giới', 'Nam giới', 'Tỷ lệ như nhau', 'Chỉ gặp ở trẻ em'],
    correctAnswer: 1,
    explanation: 'Hemophilia là bệnh di truyền liên kết với nhiễm sắc thể giới tính X, nên nam giới có tỷ lệ mắc bệnh cao hơn nhiều so với nữ giới.',
    points: 20,
    category: 'health'
  },
  {
    id: 'q4',
    question: 'Tế bào máu nào có chức năng vận chuyển oxy đi nuôi cơ thể?',
    options: ['Bạch cầu', 'Tiểu cầu', 'Hồng cầu', 'Huyết tương'],
    correctAnswer: 2,
    explanation: 'Hồng cầu chứa huyết sắc tố (hemoglobin), có nhiệm vụ gắn kết và vận chuyển oxy từ phổi đến các mô và cơ quan.',
    points: 20,
    category: 'health'
  },
  {
    id: 'q5',
    question: 'Ung thư máu (Leukemia) là tình trạng tăng sinh ác tính của loại tế bào nào?',
    options: ['Hồng cầu', 'Bạch cầu', 'Tiểu cầu', 'Tế bào cơ'],
    correctAnswer: 1,
    explanation: 'Ung thư máu hay bệnh bạch cầu là tình trạng các tế bào bạch cầu tăng sinh bất thường và ác tính trong tủy xương.',
    points: 20,
    category: 'health'
  },
  {
    id: 'q6',
    question: 'Tình huống: Bạn đang ở một điểm hiến máu và thấy một người vừa hiến xong có biểu hiện chóng mặt, vã mồ hôi. Bạn nên làm gì?',
    options: [
      'Để họ tự đi về nhà nghỉ ngơi',
      'Cho họ uống nước đá lạnh ngay lập tức',
      'Đỡ họ nằm xuống, kê cao chân và báo cho nhân viên y tế',
      'Yêu cầu họ đứng dậy đi lại cho thoáng'
    ],
    correctAnswer: 2,
    explanation: 'Đây là biểu hiện của phản ứng sau hiến máu. Cần cho người hiến nằm nghỉ, kê cao chân để máu lưu thông lên não và báo ngay cho nhân viên y tế hỗ trợ.',
    points: 30,
    category: 'general'
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deduplicate = <T extends { id: string }>(items: T[]): T[] => {
    if (!Array.isArray(items)) return items;
    const seen = new Set<string>();
    return items.map(item => {
      if (seen.has(item.id)) {
        return { ...item, id: `${item.id}-${Math.random().toString(36).substr(2, 9)}` };
      }
      seen.add(item.id);
      return item;
    });
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!isAuthReady) return;
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setEvents(eventsData);
    }, (error) => {
      console.error("Error fetching events:", error);
      // Fallback to mock events if there's a permission error
      setEvents(MOCK_EVENTS);
    });
    return unsubscribe;
  }, [isAuthReady]);

  const getEventStatus = (event: Event): 'upcoming' | 'ongoing' | 'completed' => {
    const now = new Date();
    const startDate = new Date(event.startDate || event.date);
    const endDate = new Date(event.endDate || event.date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 'completed';
    
    const [startTimeStr, endTimeStr] = event.time.split(' - ');
    
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);
    
    if (now < startDateTime) return 'upcoming';
    if (now >= startDateTime && now <= endDateTime) return 'ongoing';
    return 'completed';
  };

  const currentEvents = events.map(e => ({
    ...e,
    status: getEventStatus(e)
  }));

  const [records, setRecords] = useState<DonationRecord[]>([]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!currentUser) {
      setRecords([]);
      return;
    }
    if (!auth.currentUser) {
      setRecords(MOCK_RECORDS);
      return;
    }
    let q;
    if (['admin', 'staff', 'organizer'].includes(currentUser.role)) {
      q = query(collection(db, 'registrations'));
    } else {
      q = query(collection(db, 'registrations'), where('userId', '==', auth.currentUser.uid));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DonationRecord));
      setRecords(recordsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'registrations');
    });
    return unsubscribe;
  }, [isAuthReady, currentUser?.id, currentUser?.role]);

  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    if (!isAuthReady) return;
    const q = query(collection(db, 'rewards'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rewardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
      setRewards(rewardsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rewards');
    });
    return unsubscribe;
  }, [isAuthReady]);
  
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>(() => {
    const saved = localStorage.getItem('Máu+_redeemed_rewards');
    return saved ? deduplicate(JSON.parse(saved)) : MOCK_REDEEMED_REWARDS;
  });

  const [badges, setBadges] = useState<Badge[]>([]);
  
  useEffect(() => {
    if (!isAuthReady) return;
    const q = query(collection(db, 'badges'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed MOCK_BADGES only if user is admin/staff/organizer
        if (currentUser && ['admin', 'staff', 'organizer'].includes(currentUser.role)) {
          MOCK_BADGES.forEach(async (badge) => {
            try {
              await setDoc(doc(db, 'badges', badge.id), { ...badge, createdAt: new Date().toISOString() });
            } catch (e) {
              console.error("Error seeding badge", e);
            }
          });
        }
        setBadges(MOCK_BADGES);
        return;
      }
      const badgesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge));
      setBadges(badgesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'badges');
    });
    return unsubscribe;
  }, [isAuthReady, currentUser]);

  const certificateTemplates = MOCK_CERTIFICATE_TEMPLATES;

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;
    const q = query(collection(db, 'certificates'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed MOCK_CERTIFICATES only if user is admin/staff/organizer
        if (currentUser && ['admin', 'staff', 'organizer'].includes(currentUser.role)) {
          MOCK_CERTIFICATES.forEach(async (cert) => {
            try {
              await setDoc(doc(db, 'certificates', cert.id), { ...cert, createdAt: new Date().toISOString() });
            } catch (e) {
              console.error("Error seeding certificate", e);
            }
          });
        }
        setCertificates(MOCK_CERTIFICATES);
        return;
      }
      const certsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Certificate));
      setCertificates(certsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'certificates');
    });
    return unsubscribe;
  }, [isAuthReady, currentUser]);

  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    if (!isAuthReady) return;
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    if (!auth.currentUser) {
      setNotifications(MOCK_NOTIFICATIONS);
      return;
    }
    const q = query(collection(db, 'notifications'), where('userId', '==', auth.currentUser.uid), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notificationsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });
    return unsubscribe;
  }, [isAuthReady, currentUser?.id]);

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('Máu+_reviews');
    return saved ? deduplicate(JSON.parse(saved)) : MOCK_REVIEWS;
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('Máu+_community_posts');
    return saved ? deduplicate(JSON.parse(saved)) : MOCK_COMMUNITY_POSTS;
  });

  useEffect(() => {
    if (!isAuthReady) return;
    if (!auth.currentUser || !currentUser || !['admin', 'staff', 'organizer'].includes(currentUser.role)) {
      setUsers(MOCK_USERS_LIST);
      return;
    }
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return unsubscribe;
  }, [isAuthReady, currentUser]);



  const [emergencyCalls, setEmergencyCalls] = useState<EmergencyCall[]>(() => {
    const saved = localStorage.getItem('Máu+_emergency_calls');
    return saved ? deduplicate(JSON.parse(saved)) : MOCK_EMERGENCY_CALLS;
  });

  const mergeChallenges = (savedChallenges: Challenge[], defaultChallenges: Challenge[]) => {
    const savedById = new Map(savedChallenges.map(challenge => [challenge.id, challenge]));
    const merged = defaultChallenges.map(defaultChallenge => {
      const saved = savedById.get(defaultChallenge.id);
      if (!saved) return defaultChallenge;
      return {
        ...defaultChallenge,
        participants: saved.participants ?? defaultChallenge.participants,
      };
    });
    const extras = savedChallenges.filter(challenge => !defaultChallenges.some(dc => dc.id === challenge.id));
    return [...merged, ...extras];
  };

  const [challenges, setChallenges] = useState<Challenge[]>(() => {
    const saved = localStorage.getItem('Máu+_challenges');
    if (!saved) return MOCK_CHALLENGES;

    try {
      const parsed: Challenge[] = deduplicate(JSON.parse(saved));
      return mergeChallenges(parsed, MOCK_CHALLENGES);
    } catch {
      return MOCK_CHALLENGES;
    }
  });

  useEffect(() => {
    const missingChallenges = MOCK_CHALLENGES.filter(defaultChallenge =>
      !challenges.some(challenge => challenge.id === defaultChallenge.id)
    );

    if (missingChallenges.length > 0) {
      setChallenges(prevChallenges => mergeChallenges(prevChallenges, MOCK_CHALLENGES));
    }
  }, [challenges]);

  const [quizzes, setQuizzes] = useState<Quiz[]>(MOCK_QUIZZES);

  const [userQuizAttempts, setUserQuizAttempts] = useState<UserQuizAttempt[]>(() => {
    const saved = localStorage.getItem('Máu+_quiz_attempts');
    return saved ? JSON.parse(saved) : [];
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>(() => {
    const saved = localStorage.getItem('Máu+_role_permissions');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean up duplicates
      Object.keys(parsed).forEach(role => {
        parsed[role as UserRole] = [...new Set(parsed[role as UserRole])];
      });
      return parsed;
    }
    return {
      admin: ['all'],
      staff: ['events.read', 'events.write', 'donors.read', 'donors.write', 'rewards.read', 'rewards.write', 'locations.read', 'locations.write'],
      organizer: ['events.read', 'events.write', 'donors.read'],
      donor: ['events.read', 'rewards.read', 'locations.read']
    };
  });

  useEffect(() => {
    localStorage.setItem('Máu+_role_permissions', JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  const updateRolePermissions = (role: UserRole, permissions: string[]) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: permissions
    }));
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location", error);
        }
      );
    }
  }, []);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(1));
  };

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('Máu+_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('Máu+_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('Máu+_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('Máu+_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('Máu+_redeemed_rewards', JSON.stringify(redeemedRewards));
  }, [redeemedRewards]);

  useEffect(() => {
    localStorage.setItem('Máu+_certificate_templates', JSON.stringify(certificateTemplates));
  }, [certificateTemplates]);

  useEffect(() => {
    localStorage.setItem('Máu+_certificates', JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem('Máu+_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('Máu+_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('Máu+_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('Máu+_community_posts', JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem('Máu+_emergency_calls', JSON.stringify(emergencyCalls));
  }, [emergencyCalls]);

  useEffect(() => {
    localStorage.setItem('Máu+_challenges', JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem('Máu+_quiz_attempts', JSON.stringify(userQuizAttempts));
  }, [userQuizAttempts]);

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'Máu+_events' && e.newValue) {
        setEvents(JSON.parse(e.newValue));
      }
      if (e.key === 'Máu+_rewards' && e.newValue) {
        setRewards(JSON.parse(e.newValue));
      }
      if (e.key === 'Máu+_records' && e.newValue) {
        setRecords(JSON.parse(e.newValue));
      }
      if (e.key === 'Máu+_badges' && e.newValue) {
        setBadges(JSON.parse(e.newValue));
      }
      if (e.key === 'Máu+_user') {
        setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
      if (e.key === 'Máu+_notifications' && e.newValue) {
        setNotifications(JSON.parse(e.newValue));
      }
      if (e.key === 'Máu+_reviews' && e.newValue) {
        setReviews(JSON.parse(e.newValue));
      }
      if (e.key === 'Máu+_community_posts' && e.newValue) {
        setCommunityPosts(JSON.parse(e.newValue));
      }
      if (e.key === 'Máu+_emergency_calls' && e.newValue) {
        setEmergencyCalls(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        const saved = localStorage.getItem('Máu+_user');
        if (saved) {
           try {
             const parsed = JSON.parse(saved);
             if (parsed.email === 'admin@Máu+.vn' || parsed.email === 'donor@Máu+.vn' || parsed.email === 'admin@hospital.com') {
                return; // Don't clear demo users
             }
           } catch (e) {
             // ignore
           }
        }
        setCurrentUser(null);
        localStorage.removeItem('Máu+_user');
      } else {
        // Fetch user data directly from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
        } else {
          // Default to donor if not found
          const userData = {
            id: user.uid,
            name: user.displayName || 'Người dùng',
            email: user.email || '',
            role: 'donor',
            points: 0,
            donationsCount: 0,
            avatar: user.photoURL || undefined,
            bloodGroup: 'Chưa xác định'
          };
          setCurrentUser(userData as User);
        }
      }
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    const q = query(collection(db, 'locations'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locs: Location[] = [];
      snapshot.forEach((doc) => {
        locs.push({ id: doc.id, ...doc.data() } as Location);
      });
      setLocations(locs);
    }, (error) => {
      console.error("Error fetching locations:", error);
      handleFirestoreError(error, OperationType.LIST, 'locations');
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const login = (role: UserRole, googleUser?: any, userData?: any) => {
    if (googleUser && userData) {
      setCurrentUser({ id: googleUser.uid, ...userData } as User);
    } else if (googleUser) {
      // Wait for onAuthStateChanged
    } else {
      const user = users.find(u => u.role === role) || MOCK_USERS[role];
      setCurrentUser(user);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
    setCurrentUser(null);
  };

  const changePassword = async (newPassword: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Đổi mật khẩu thành công');
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error('Có lỗi xảy ra khi đổi mật khẩu');
      throw error;
    }
  };

  const addNotification = async (notifData: Omit<Notification, 'id' | 'date' | 'isRead'>) => {
    if (!auth.currentUser) {
      console.warn("Cannot add notification: user not authenticated");
      return;
    }
    const newNotif: Notification = {
      ...notifData,
      id: `n${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      isRead: false
    };
    try {
      await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  };

  const toggleInterestedEvent = (eventId: string) => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để thực hiện chức năng này.');
      return;
    }

    const isInterested = currentUser.interestedEvents?.includes(eventId);
    const newInterestedEvents = isInterested
      ? (currentUser.interestedEvents || []).filter(id => id !== eventId)
      : [...(currentUser.interestedEvents || []), eventId];

    updateUser(currentUser.id, { interestedEvents: newInterestedEvents });
    
    if (isInterested) {
      toast.success('Đã xóa khỏi danh sách quan tâm.');
    } else {
      toast.success('Đã thêm vào danh sách quan tâm.');
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.filter(n => n.userId !== currentUser.id));
  };

  // Check for eligibility reminders
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'donor') return;

    const checkEligibility = () => {
      if (!currentUser.lastDonationDate) return;

      const lastDate = parseISO(currentUser.lastDonationDate);
      if (!isValid(lastDate)) return;
      
      const nextEligibleDate = addMonths(lastDate, 3);
      const now = new Date();

      if (isAfter(now, nextEligibleDate) || now.getTime() === nextEligibleDate.getTime()) {
        const hasReminder = notifications.some(n => 
          n.userId === currentUser.id && 
          n.type === 'reminder' && 
          n.title === 'Bạn đã đủ điều kiện hiến máu' &&
          new Date(n.date).getMonth() === now.getMonth() &&
          new Date(n.date).getFullYear() === now.getFullYear()
        );

        if (!hasReminder) {
          const formattedDate = format(nextEligibleDate, 'dd/MM/yyyy', { locale: vi });
          addNotification({
            userId: currentUser.id,
            title: 'Bạn đã đủ điều kiện hiến máu',
            message: `Chúc mừng! Bạn đã đủ điều kiện hiến máu tiếp theo từ ngày ${formattedDate}. Hãy tham gia hiến máu để tiếp tục hành trình nhân đạo của mình nhé!`,
            type: 'reminder',
            link: '/events'
          });

          toast.info('Bạn đã đủ điều kiện hiến máu!', {
            description: `Bạn có thể hiến máu tiếp theo từ ngày ${formattedDate}.`,
            duration: 10000,
          });
        }
      }
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(checkEligibility, 2000);
    return () => clearTimeout(timer);
  }, [currentUser?.id, currentUser?.lastDonationDate, notifications.length]);

  const registerForEvent = async (eventId: string, expectedAmount?: number) => {
    if (!currentUser) return { success: false, message: 'Vui lòng đăng nhập để đăng ký.' };
    
    const event = events.find(e => e.id === eventId);
    if (!event) return { success: false, message: 'Không tìm thấy sự kiện.' };
    
    if (event.registered >= event.target) {
      return { success: false, message: 'Sự kiện đã đủ số lượng đăng ký.' };
    }

    const existingRecord = records.find(r => r.userId === currentUser.id && r.eventId === eventId && r.status !== 'cancelled');
    if (existingRecord) {
      return { success: false, message: 'Bạn đã đăng ký sự kiện này rồi.' };
    }

    // Check eligibility based on last donation date
    if (currentUser.lastDonationDate) {
      const lastDonation = new Date(currentUser.lastDonationDate);
      const nextEligibleDate = new Date(lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000);
      const now = new Date();
      
      if (now < nextEligibleDate) {
        const diffTime = nextEligibleDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { 
          success: false, 
          message: `Bạn chưa đủ điều kiện hiến máu. Bạn cần chờ thêm ${diffDays} ngày để đủ điều kiện hiến máu tiếp theo.` 
        };
      }
    }
    
    const recordId = `${currentUser.id}_${eventId}`;
    const newRecord: DonationRecord = {
      id: recordId,
      userId: currentUser.id,
      eventId,
      date: event.date,
      amount: 0,
      expectedAmount: expectedAmount || 250, // Default to 250ml
      status: 'registered',
      bloodGroup: currentUser.bloodGroup || 'Chưa xác định' as BloodGroup
    };
    
    // Optimistic update
    setRecords([...records, newRecord]);
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, registered: e.registered + 1 } : e
    ));

    try {
      // Write to Firestore
      const recordData = {
        ...newRecord,
        registeredAt: new Date().toISOString(),
        userName: currentUser.name,
        userEmail: currentUser.email
      };
      await setDoc(doc(db, 'registrations', recordId), recordData, { merge: true });
      
      // Update event registered count in Firestore
      await updateDoc(doc(db, 'events', eventId), {
        registered: event.registered + 1
      });
    } catch (error) {
      // Revert optimistic update on error
      setRecords(records.filter(r => r.id !== recordId));
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, registered: e.registered } : e
      ));
      handleFirestoreError(error, OperationType.CREATE, `registrations/${recordId}`);
      return { success: false, message: 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.' };
    }

    return { success: true };
  };

  const cancelRegistration = async (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (!record || (record.status !== 'registered' && record.status !== 'checked-in')) return;

    // Optimistic update
    // 1. Update event registered count
    setEvents(prevEvents => prevEvents.map(e => 
      e.id === record.eventId ? { ...e, registered: Math.max(0, e.registered - 1) } : e
    ));

    // 2. Update record status
    setRecords(prevRecords => prevRecords.map(r => 
      r.id === recordId ? { ...r, status: 'cancelled' } : r
    ));

    try {
      // Write to Firestore
      await updateDoc(doc(db, 'registrations', recordId), { status: 'cancelled' });
      
      const event = events.find(e => e.id === record.eventId);
      if (event) {
        await updateDoc(doc(db, 'events', event.id), {
          registered: Math.max(0, event.registered - 1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registrations/${recordId}`);
    }
  };

  const checkInUser = async (recordId: string) => {
    // Optimistic update
    setRecords(records.map(r => 
      r.id === recordId ? { ...r, status: 'checked-in' } : r
    ));

    try {
      await updateDoc(doc(db, 'registrations', recordId), { status: 'checked-in' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registrations/${recordId}`);
    }
  };

  const issueCertificate = async (userId: string, eventId: string, recordId: string) => {
    if (certificateTemplates.length === 0) return;
    
    // Check if already issued
    if (certificates.some(c => c.recordId === recordId)) return;

    const user = users.find(u => u.id === userId);
    const donationsCount = user ? user.donationsCount + 1 : 1; // +1 because this is called during completeDonation

    // Find the best template
    // 1. Match eventId and minDonations
    // 2. Match eventId
    // 3. Match minDonations
    // 4. Fallback to active template
    
    let bestTemplate = certificateTemplates.find(t => t.status !== 'hidden' && t.eventId === eventId && t.minDonations && donationsCount >= t.minDonations);
    
    if (!bestTemplate) {
      bestTemplate = certificateTemplates.find(t => t.status !== 'hidden' && t.eventId === eventId);
    }
    
    if (!bestTemplate) {
      // Sort by minDonations descending to get the highest applicable tier
      const tierTemplates = certificateTemplates
        .filter(t => t.status !== 'hidden' && !t.eventId && t.minDonations && donationsCount >= t.minDonations)
        .sort((a, b) => (b.minDonations || 0) - (a.minDonations || 0));
      
      if (tierTemplates.length > 0) {
        bestTemplate = tierTemplates[0];
      }
    }

    if (!bestTemplate) {
      bestTemplate = certificateTemplates.find(t => t.status !== 'hidden' && !t.eventId && !t.minDonations) || certificateTemplates.find(t => t.status !== 'hidden') || certificateTemplates[0];
    }

    const certId = `cert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newCert: Certificate = {
      id: certId,
      userId,
      eventId,
      recordId,
      templateId: bestTemplate.id,
      issueDate: new Date().toISOString(),
      status: 'issued'
    };
    
    // Optimistic update
    setCertificates(prev => [newCert, ...prev]);

    try {
      // Write to Firestore
      await setDoc(doc(db, 'certificates', certId), newCert);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `certificates/${certId}`);
    }
  };

  const revokeCertificate = async (id: string) => {
    setCertificates(prev => prev.map(c => 
      c.id === id ? { ...c, status: 'revoked' } : c
    ));
    try {
      await updateDoc(doc(db, 'certificates', id), { status: 'revoked' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `certificates/${id}`);
    }
  };

  const regenerateCertificate = async (id: string) => {
    const newIssueDate = new Date().toISOString();
    setCertificates(prev => prev.map(c => 
      c.id === id ? { ...c, issueDate: newIssueDate, status: 'issued' } : c
    ));
    try {
      await updateDoc(doc(db, 'certificates', id), { issueDate: newIssueDate, status: 'issued' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `certificates/${id}`);
    }
  };

  const duplicateTemplate = (id: string) => {
    // No-op: Templates are fixed in code
  };

  const toggleTemplateStatus = (id: string) => {
    // No-op: Templates are fixed in code
  };

  const completeDonation = async (recordId: string, amount: number, bloodGroup: BloodGroup) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const user = users.find(u => u.id === record.userId);
    if (!user) return;

    const newCount = user.donationsCount + 1;
    const newPoints = (user.points || 0) + 50;
    
    // Check for new badges
    const newlyEarnedBadges: string[] = [];
    const newlyEarnedBadgeObjects: { badgeId: string; dateAwarded: string }[] = [];
    badges.forEach(badge => {
      if (newCount >= badge.condition && !user.seenBadges?.includes(badge.level)) {
        newlyEarnedBadges.push(badge.level);
        newlyEarnedBadgeObjects.push({ badgeId: badge.id, dateAwarded: new Date().toISOString() });
      }
    });

    const updatedUser = {
      ...user,
      points: newPoints,
      donationsCount: newCount,
      lastDonationDate: record.date,
      bloodGroup: bloodGroup,
      isRegularDonor: newCount >= 3,
      seenBadges: [...(user.seenBadges || []), ...newlyEarnedBadges],
      earnedBadges: [...(user.earnedBadges || []), ...newlyEarnedBadgeObjects]
    };

    // Optimistic updates
    setRecords(prevRecords => prevRecords.map(r => 
      r.id === recordId ? { ...r, status: 'completed' as const, amount, bloodGroup } : r
    ));

    setUsers(prevUsers => prevUsers.map(u => u.id === record.userId ? updatedUser : u));

    if (currentUser && record.userId === currentUser.id) {
      setCurrentUser(updatedUser);
    }

    // Issue certificate
    issueCertificate(record.userId, record.eventId, recordId);

    // Notifications
    addNotification({
      userId: user.id,
      title: 'Hiến máu thành công! 🎉',
      message: `Cảm ơn bạn đã hiến ${amount}ml máu nhóm ${bloodGroup}. Bạn đã nhận được 50 điểm tích lũy.`,
      type: 'reminder',
      link: '/history#records'
    });

    newlyEarnedBadges.forEach(badgeLevel => {
      const badge = badges.find(b => b.level === badgeLevel);
      addNotification({
        userId: user.id,
        title: 'Huy hiệu mới! 🏆',
        message: `Chúc mừng! Bạn đã đạt được ${badge?.name || badgeLevel} vì đã hiến máu ${newCount} lần.`,
        type: 'reminder',
        link: '/profile#badges'
      });
    });

    try {
      // Write to Firestore
      await updateDoc(doc(db, 'registrations', recordId), {
        status: 'completed',
        amount,
        bloodGroup
      });

      await updateDoc(doc(db, 'users', record.userId), {
        points: newPoints,
        donationsCount: newCount,
        lastDonationDate: record.date,
        bloodGroup: bloodGroup,
        isRegularDonor: newCount >= 3,
        seenBadges: updatedUser.seenBadges,
        earnedBadges: updatedUser.earnedBadges
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registrations/${recordId}`);
    }
  };

  const receiveGift = async (recordId: string, giftTypeInput: string | string[]) => {
    const giftTypes = Array.isArray(giftTypeInput) ? giftTypeInput : [giftTypeInput];
    const giftTypeStr = giftTypes.join(', ');

    const record = records.find(r => r.id === recordId);
    if (!record) return;

    // Optimistic updates
    setRecords(prevRecords => prevRecords.map(r => 
      r.id === recordId ? { ...r, giftReceived: true, giftType: giftTypeStr, giftReceivedDate: new Date().toISOString() } : r
    ));

    setRewards(prevRewards => prevRewards.map(reward => {
      if (giftTypes.includes(reward.name) && reward.stock > 0) {
        return { ...reward, stock: reward.stock - 1 };
      }
      return reward;
    }));

    const user = users.find(u => u.id === record.userId);
    if (user) {
      const newPoints = (user.points || 0) + 10;
      updateUser(record.userId, { points: newPoints });

      addNotification({
        userId: record.userId,
        title: 'Nhận quà thành công! 🎁',
        message: `Bạn đã nhận được phần quà: ${giftTypeStr}. Cảm ơn bạn đã đóng góp cho cộng đồng!`,
        type: 'reminder',
        link: '/history#records'
      });
    }

    try {
      await updateDoc(doc(db, 'registrations', recordId), {
        giftReceived: true,
        giftType: giftTypeStr,
        giftReceivedDate: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registrations/${recordId}`);
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    // Optimistic update
    setUsers(users.map(u => u.id === id ? { ...u, ...userData } : u));
    if (currentUser && currentUser.id === id) {
      setCurrentUser({ ...currentUser, ...userData });
    }
    
    // Write to Firestore
    try {
      await updateDoc(doc(db, 'users', id), userData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  };

  const addEvent = async (eventData: Omit<Event, 'id' | 'registered' | 'status'>) => {
    try {
      const newEventRef = doc(collection(db, 'events'));
      const newEvent: Event = {
        ...eventData,
        id: newEventRef.id,
        registered: 0,
        status: 'upcoming'
      };
      await setDoc(newEventRef, newEvent);
      
      // Notify all donors about new event
      users.filter(u => u.role === 'donor').forEach(u => {
        addNotification({
          userId: u.id,
          title: 'Sự kiện hiến máu mới',
          message: `Sự kiện "${newEvent.title}" vừa được tạo tại ${newEvent.location}. Đăng ký ngay!`,
          type: 'event_new',
          link: `/events/${newEvent.id}`
        });
      });

      // If it's urgent, send emergency notification to matching blood groups
      if (newEvent.category === 'urgent') {
        users.filter(u => u.role === 'donor').forEach(u => {
          addNotification({
            userId: u.id,
            title: 'CẦN MÁU KHẨN CẤP',
            message: `Sự kiện khẩn cấp: "${newEvent.title}" đang rất cần người tham gia.`,
            type: 'emergency',
            link: `/events/${newEvent.id}`
          });
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'events');
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      const oldEvent = events.find(e => e.id === id);
      await updateDoc(doc(db, 'events', id), eventData);

      // If significant info changed, notify registered users
      if (oldEvent && (eventData.location || eventData.date || eventData.time)) {
        const registeredUserIds = records
          .filter(r => r.eventId === id && r.status === 'registered')
          .map(r => r.userId);

        registeredUserIds.forEach(userId => {
          addNotification({
            userId,
            title: 'Thay đổi thông tin sự kiện',
            message: `Sự kiện "${oldEvent.title}" bạn đã đăng ký có thay đổi về thời gian hoặc địa điểm. Vui lòng kiểm tra lại.`,
            type: 'event_update',
            link: `/events/${id}`
          });
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'events');
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'events');
    }
  };

  const addBadge = async (badgeData: Omit<Badge, 'id'>) => {
    const newBadge: Badge = {
      ...badgeData,
      id: `b${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    try {
      await setDoc(doc(db, 'badges', newBadge.id), {
        ...newBadge,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'badges');
    }
  };

  const updateBadge = async (id: string, badgeData: Partial<Badge>) => {
    try {
      await updateDoc(doc(db, 'badges', id), {
        ...badgeData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'badges');
    }
  };

  const deleteBadge = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'badges', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'badges');
    }
  };

  const addReward = async (rewardData: Omit<Reward, 'id'>) => {
    try {
      const newRewardRef = doc(collection(db, 'rewards'));
      const newReward: Reward = {
        ...rewardData,
        id: newRewardRef.id
      };
      await setDoc(newRewardRef, newReward);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rewards');
    }
  };

  const updateReward = async (id: string, rewardData: Partial<Reward>) => {
    try {
      await updateDoc(doc(db, 'rewards', id), rewardData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'rewards');
    }
  };

  const deleteReward = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'rewards', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'rewards');
    }
  };

  const markBadgeAsSeen = (badgeId: string) => {
    if (currentUser && !currentUser.seenBadges?.includes(badgeId)) {
      updateUser(currentUser.id, {
        seenBadges: [...(currentUser.seenBadges || []), badgeId]
      });
    }
  };

  const redeemReward = (rewardId: string) => {
    if (!currentUser) return { success: false, message: 'Vui lòng đăng nhập.' };
    
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return { success: false, message: 'Không tìm thấy phần thưởng.' };
    
    if ((currentUser?.points || 0) < reward.pointsCost) {
      return { success: false, message: 'Bạn không đủ điểm để đổi phần thưởng này.' };
    }

    const voucherCode = reward.type === 'voucher' ? `VOUCHER-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : undefined;

    const newRedeemedReward: RedeemedReward = {
      id: `rr${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      rewardId: reward.id,
      date: new Date().toISOString(),
      voucherCode,
      isUsed: false
    };

    setRedeemedRewards([newRedeemedReward, ...redeemedRewards]);
    setCurrentUser({
      ...currentUser,
      points: (currentUser?.points || 0) - reward.pointsCost
    });

    return { success: true, voucherCode };
  };

  const addCertificateTemplate = async (templateData: Omit<CertificateTemplate, 'id'>) => {
    // No-op: Templates are fixed in code
  };

  const updateCertificateTemplate = async (id: string, templateData: Partial<CertificateTemplate>) => {
    // No-op: Templates are fixed in code
  };

  const deleteCertificateTemplate = async (id: string) => {
    // No-op: Templates are fixed in code
  };

  const addReview = (reviewData: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `rev${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString()
    };
    setReviews([newReview, ...reviews]);
  };

  const updateReview = (id: string, reviewData: Partial<Review>) => {
    setReviews(prev => prev.map(review => 
      review.id === id ? { ...review, ...reviewData } : review
    ));
  };

  const deleteReview = (id: string) => {
    setReviews(prev => prev.filter(review => review.id !== id));
  };

  const addCommunityPost = (postData: Omit<CommunityPost, 'id' | 'date' | 'likes' | 'comments' | 'userName' | 'userAvatar'>) => {
    if (!currentUser) return;
    const newPost: CommunityPost = {
      ...postData,
      id: `p${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userRole: currentUser.role,
      likes: [],
      comments: [],
      date: new Date().toISOString(),
      isPinned: postData.isPinned || false
    };
    setCommunityPosts([newPost, ...communityPosts]);
    
    // Reward points for sharing
    updateUser(currentUser.id, { points: (currentUser?.points || 0) + 10 });
    toast.success('Đã đăng bài viết! Bạn nhận được 10 điểm tích lũy.');
  };

  const deleteCommunityPost = (postId: string) => {
    setCommunityPosts(prev => prev.filter(post => post.id !== postId));
  };

  const updateCommunityPost = (postId: string, title: string, content: string, imageUrls: string[]) => {
    setCommunityPosts(prev => prev.map(post => post.id === postId ? { ...post, title, content, imageUrls } : post));
  };

  const pinCommunityPost = (postId: string) => {
    setCommunityPosts(prev => prev.map(post => post.id === postId ? { ...post, isPinned: !post.isPinned } : post));
  };

  const reorderCommunityPosts = (sourceId: string, destinationId: string) => {
    setCommunityPosts(prev => {
      const sourceIndex = prev.findIndex(p => p.id === sourceId);
      const destinationIndex = prev.findIndex(p => p.id === destinationId);
      if (sourceIndex === -1 || destinationIndex === -1) return prev;
      
      const result = Array.from(prev);
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);
      return result;
    });
  };

  const likePost = (postId: string) => {
    if (!currentUser) return;
    setCommunityPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.likes.includes(currentUser.id);
        const newLikes = isLiked 
          ? post.likes.filter(id => id !== currentUser.id)
          : [...post.likes, currentUser.id];
        return { ...post, likes: newLikes };
      }
      return post;
    }));
  };

  const addComment = (postId: string, content: string) => {
    if (!currentUser) return;
    const newComment: CommunityComment = {
      id: `c${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content,
      date: new Date().toISOString()
    };
    setCommunityPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    }));
  };

  const addEmergencyCall = (callData: Omit<EmergencyCall, 'id' | 'date' | 'status'>) => {
    const newCall: EmergencyCall = {
      ...callData,
      id: `ec${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      status: 'active'
    };
    setEmergencyCalls([newCall, ...emergencyCalls]);
    
    // Notify all donors about emergency call
    users.filter(u => u.role === 'donor').forEach(u => {
      addNotification({
        userId: u.id,
        title: 'KÊU GỌI HIẾN MÁU KHẨN CẤP',
        message: `Bệnh viện ${newCall.hospitalName} đang cần gấp nhóm máu ${newCall.bloodGroup}.`,
        type: 'emergency',
        bloodGroup: newCall.bloodGroup
      });
    });
  };

  const resolveEmergencyCall = (id: string) => {
    setEmergencyCalls(prev => prev.map(call => 
      call.id === id ? { ...call, status: 'resolved' } : call
    ));
  };

  const joinChallenge = (challengeId: string) => {
    if (!currentUser) return;
    
    if (currentUser.joinedChallenges?.includes(challengeId)) {
      toast.error('Bạn đã tham gia thử thách này rồi.');
      return;
    }

    const newJoined = [...(currentUser.joinedChallenges || []), challengeId];
    updateUser(currentUser.id, { joinedChallenges: newJoined });
    
    setChallenges(prev => prev.map(ch => 
      ch.id === challengeId ? { ...ch, participants: [...ch.participants, currentUser.id] } : ch
    ));
    
    toast.success('Đã tham gia thử thách! Hãy cố gắng hoàn thành nhé.');
  };

  const leaveChallenge = (challengeId: string) => {
    if (!currentUser) return;
    if (!currentUser.joinedChallenges?.includes(challengeId)) return;

    const newJoined = currentUser.joinedChallenges.filter(id => id !== challengeId);
    updateUser(currentUser.id, { joinedChallenges: newJoined });

    setChallenges(prev => prev.map(ch => 
      ch.id === challengeId ? { ...ch, participants: ch.participants.filter(userId => userId !== currentUser.id) } : ch
    ));

    toast.success('Bạn đã hủy tham gia thử thách.');
  };

  const submitQuizAnswer = async (quizId: string, answerIndex: number) => {
    if (!currentUser) return { success: false, message: 'Vui lòng đăng nhập.', pointsEarned: 0 };
    
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return { success: false, message: 'Không tìm thấy câu đố.', pointsEarned: 0 };
    
    const todayStr = new Date().toISOString().split('T')[0];
    if (currentUser.lastGamePlayDate === todayStr) {
      return { success: false, message: 'Bạn đã tham gia trả lời câu hỏi hôm nay rồi.', pointsEarned: 0 };
    }

    const isCorrect = quiz.correctAnswer === answerIndex;
    const pointsEarned = isCorrect ? quiz.points : 0;

    const newAttempt: UserQuizAttempt = {
      userId: currentUser.id,
      quizId,
      isCorrect,
      date: new Date().toISOString()
    };

    setUserQuizAttempts(prev => [...prev, newAttempt]);

    const lastPlayDate = currentUser.lastGamePlayDate || '';
    
    let updatedStreak = currentUser.dailyStreak || 0;
    if (lastPlayDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastPlayDate === yesterdayStr) {
        updatedStreak += 1;
      } else {
        updatedStreak = 1;
      }
    }

    let updatedCorrectCount = (currentUser.correctAnswersCount || 0) + (isCorrect ? 1 : 0);
    let updatedConsecutive = isCorrect ? (currentUser.consecutiveCorrect || 0) + 1 : 0;
    let updatedMaxConsecutive = Math.max(currentUser.maxConsecutiveCorrect || 0, updatedConsecutive);
    let updatedLevel = Math.floor(updatedCorrectCount / 10) + 1;

    let updatedChallenges = [...(currentUser.completedChallenges || [])];
    
    // Check for new badges
    const newlyEarnedBadgeObjects: { badgeId: string; dateAwarded: string }[] = [];
    
    if (updatedCorrectCount >= 10 && !updatedChallenges.includes('b_knowledge')) {
      updatedChallenges.push('b_knowledge');
      newlyEarnedBadgeObjects.push({ badgeId: 'b_knowledge', dateAwarded: new Date().toISOString() });
      toast.success('Bạn đã nhận được huy hiệu: Người hiểu biết!');
    }
    if (updatedCorrectCount >= 50 && !updatedChallenges.includes('b_expert')) {
      updatedChallenges.push('b_expert');
      newlyEarnedBadgeObjects.push({ badgeId: 'b_expert', dateAwarded: new Date().toISOString() });
      toast.success('Bạn đã nhận được huy hiệu: Chuyên gia hiến máu!');
    }
    if (updatedMaxConsecutive >= 10 && !updatedChallenges.includes('b_intellect')) {
      updatedChallenges.push('b_intellect');
      newlyEarnedBadgeObjects.push({ badgeId: 'b_intellect', dateAwarded: new Date().toISOString() });
      toast.success('Bạn đã nhận được huy hiệu: Siêu trí tuệ!');
    }

    if (isCorrect) {
      const allCorrectAttempts = [...userQuizAttempts, newAttempt].filter(a => a.userId === currentUser.id && a.isCorrect);
      const uniqueCorrectQuizzes = new Set(allCorrectAttempts.map(a => a.quizId));
      
      if (uniqueCorrectQuizzes.size === quizzes.length && !updatedChallenges.includes('quiz_master')) {
        updatedChallenges.push('quiz_master');
        newlyEarnedBadgeObjects.push({ badgeId: 'b_quiz', dateAwarded: new Date().toISOString() });
        setTimeout(() => {
          toast.success('Chúc mừng! Bạn đã nhận được huy hiệu Bậc thầy kiến thức!', {
            icon: '🎓',
            duration: 5000
          });
        }, 500);
      }

      await updateUser(currentUser.id, { 
        points: (currentUser?.points || 0) + pointsEarned,
        completedChallenges: updatedChallenges,
        correctAnswersCount: updatedCorrectCount,
        consecutiveCorrect: updatedConsecutive,
        maxConsecutiveCorrect: updatedMaxConsecutive,
        gameLevel: updatedLevel,
        dailyStreak: updatedStreak,
        lastGamePlayDate: todayStr,
        earnedBadges: [...(currentUser.earnedBadges || []), ...newlyEarnedBadgeObjects]
      });
      return { success: true, message: `Chính xác! Bạn nhận được ${pointsEarned} điểm.`, pointsEarned };
    } else {
      await updateUser(currentUser.id, {
        completedChallenges: updatedChallenges,
        consecutiveCorrect: 0,
        dailyStreak: updatedStreak,
        lastGamePlayDate: todayStr,
        earnedBadges: [...(currentUser.earnedBadges || []), ...newlyEarnedBadgeObjects]
      });
      return { success: false, message: answerIndex === -1 ? `Hết giờ! Đáp án đúng là: ${quiz.options[quiz.correctAnswer]}` : `Rất tiếc, câu trả lời chưa đúng. ${quiz.explanation}`, pointsEarned: 0 };
    }
  };

  const spinWheel = () => {
    if (!currentUser) return { success: false, message: 'Vui lòng đăng nhập.' };
    
    const prizes = [
      { name: '10 điểm', points: 10 },
      { name: '20 điểm', points: 20 },
      { name: '50 điểm', points: 50 },
      { name: '100 điểm', points: 100 },
      { name: 'Chúc bạn may mắn lần sau', points: 0 },
      { name: 'Voucher 10%', prize: 'Voucher 10%' },
    ];
    
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    
    if (randomPrize.points) {
      updateUser(currentUser.id, { points: (currentUser?.points || 0) + (randomPrize.points || 0) });
    }
    
    return { 
      success: true, 
      message: randomPrize.points ? `Chúc mừng! Bạn nhận được ${randomPrize.name}` : randomPrize.name,
      prize: randomPrize.prize,
      points: randomPrize.points
    };
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      login,
      logout,
      changePassword,
      events: currentEvents,
      records,
      rewards,
      redeemedRewards,
      users,
      reviews,
      updateUser,
      registerForEvent,
      cancelRegistration,
      checkInUser,
      completeDonation,
      addEvent,
      updateEvent,
      deleteEvent,
      addReview,
      updateReview,
      deleteReview,
      markBadgeAsSeen,
      redeemReward,
      userLocation,
      calculateDistance,
      badges,
      addBadge,
      updateBadge,
      deleteBadge,
      addReward,
      updateReward,
      deleteReward,
      certificateTemplates,
      addCertificateTemplate,
      updateCertificateTemplate,
      deleteCertificateTemplate,
      duplicateTemplate,
      toggleTemplateStatus,
      certificates,
      issueCertificate,
      revokeCertificate,
      regenerateCertificate,
      notifications,
      markNotificationAsRead,
      deleteNotification,
      clearNotifications,
      addNotification,
      toggleInterestedEvent,
      receiveGift,
      communityPosts,
      addCommunityPost,
      deleteCommunityPost,
      updateCommunityPost,
      pinCommunityPost,
      reorderCommunityPosts,
      likePost,
      addComment,
      emergencyCalls,
      addEmergencyCall,
      resolveEmergencyCall,
      challenges,
      joinChallenge,
      leaveChallenge,
      quizzes,
      submitQuizAnswer,
      spinWheel,
      userQuizAttempts,
      locations,
      rolePermissions,
      updateRolePermissions,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};