import { Reward } from './AppContext';

export const MOCK_REWARDS: Reward[] = [
  // Vouchers (15)
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `v${i + 1}`,
    name: `Voucher ${i + 1} - ${['Highlands', 'CGV', 'Grab', 'Shopee', 'Lazada', 'Tiki', 'CircleK', 'WinMart', 'PizzaHut', 'KFC', 'Lotteria', 'Jollibee', 'GongCha', 'Koi', 'PhucLong'][i % 15]}`,
    description: `Voucher trị giá ${50 + (i * 10)}K cho dịch vụ ${['cà phê', 'xem phim', 'di chuyển', 'mua sắm', 'mua sắm', 'mua sắm', 'tiện lợi', 'siêu thị', 'ăn uống', 'ăn uống', 'ăn uống', 'ăn uống', 'trà sữa', 'trà sữa', 'trà'][i % 15]}.`,
    pointsCost: 100 + (i * 20),
    imageUrl: `https://picsum.photos/seed/v${i + 1}/400/300`,
    type: 'voucher' as const,
    stock: 100,
    category: 'voucher' as const,
    conditionType: 'points' as const,
    conditionValue: 100 + (i * 20),
    isActive: true
  })),
  {
    id: 'v_lucky_10',
    name: 'Voucher 10% - Lucky Spin',
    description: 'Voucher giảm giá 10% nhận được từ vòng quay may mắn.',
    pointsCost: 0,
    imageUrl: 'https://picsum.photos/seed/v10/400/300',
    type: 'voucher',
    stock: 999,
    category: 'voucher',
    conditionType: 'none',
    conditionValue: 0,
    isActive: true
  },
  {
    id: 'v_lucky_20',
    name: 'Voucher 20% - Lucky Spin',
    description: 'Voucher giảm giá 20% nhận được từ vòng quay may mắn.',
    pointsCost: 0,
    imageUrl: 'https://picsum.photos/seed/v20/400/300',
    type: 'voucher',
    stock: 999,
    category: 'voucher',
    conditionType: 'none',
    conditionValue: 0,
    isActive: true
  },
  {
    id: 'v_lucky_50',
    name: 'Voucher 50% - Lucky Spin',
    description: 'Voucher giảm giá 50% nhận được từ vòng quay may mắn.',
    pointsCost: 0,
    imageUrl: 'https://picsum.photos/seed/v50/400/300',
    type: 'voucher',
    stock: 999,
    category: 'voucher',
    conditionType: 'none',
    conditionValue: 0,
    isActive: true
  },
  // Gifts (15)
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `g${i + 1}`,
    name: `Quà tặng ${i + 1} - ${['Áo thun', 'Bình nước', 'Ô dù', 'Túi vải', 'Sổ tay', 'Bút ký', 'Mũ lưỡi trai', 'Khăn mặt', 'Tất', 'Gối cổ', 'Đèn bàn', 'Sạc dự phòng', 'Loa bluetooth', 'Tai nghe', 'Chuột máy tính'][i % 15]}`,
    description: `Quà tặng hữu ích: ${['Áo thun', 'Bình nước', 'Ô dù', 'Túi vải', 'Sổ tay', 'Bút ký', 'Mũ lưỡi trai', 'Khăn mặt', 'Tất', 'Gối cổ', 'Đèn bàn', 'Sạc dự phòng', 'Loa bluetooth', 'Tai nghe', 'Chuột máy tính'][i % 15]}.`,
    pointsCost: 200 + (i * 50),
    imageUrl: `https://picsum.photos/seed/g${i + 1}/400/300`,
    type: 'gift' as const,
    stock: 50,
    category: 'shirt' as const,
    conditionType: 'donations' as const,
    conditionValue: 1 + Math.floor(i / 3),
    isActive: true
  })),
  // Souvenirs (15)
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `s${i + 1}`,
    name: `Lưu niệm ${i + 1} - ${['Móc khóa', 'Huy hiệu', 'Nam châm', 'Khung ảnh', 'Cốc sứ', 'Đĩa sứ', 'Tượng nhỏ', 'Tranh treo', 'Lịch để bàn', 'Băng đô', 'Vòng tay', 'Dây đeo thẻ', 'Miếng lót chuột', 'Giá đỡ điện thoại', 'Hộp đựng bút'][i % 15]}`,
    description: `Kỷ niệm chương Máu+: ${['Móc khóa', 'Huy hiệu', 'Nam châm', 'Khung ảnh', 'Cốc sứ', 'Đĩa sứ', 'Tượng nhỏ', 'Tranh treo', 'Lịch để bàn', 'Băng đô', 'Vòng tay', 'Dây đeo thẻ', 'Miếng lót chuột', 'Giá đỡ điện thoại', 'Hộp đựng bút'][i % 15]}.`,
    pointsCost: 50 + (i * 10),
    imageUrl: `https://picsum.photos/seed/s${i + 1}/400/300`,
    type: 'gift' as const,
    stock: 200,
    category: 'souvenir' as const,
    conditionType: 'points' as const,
    conditionValue: 50 + (i * 10),
    isActive: true
  }))
];
