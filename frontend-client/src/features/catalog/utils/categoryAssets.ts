/**
 * Tiện ích cung cấp hình ảnh đại diện và màu sắc cho danh mục sản phẩm (Shopee/Lazada aesthetic).
 */
export interface CategoryAsset {
  imageUrl: string
  accentColor: string
  bgLight: string
}

// Bảng ánh xạ từ khóa tên danh mục -> hình ảnh chất lượng cao
const CATEGORY_IMAGE_MAP: { keywords: string[]; asset: CategoryAsset }[] = [
  {
    keywords: ['điện thoại', 'smartphone', 'phone', 'phụ kiện điện thoại'],
    asset: {
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
      accentColor: '#3b82f6',
      bgLight: '#eff6ff',
    },
  },
  {
    keywords: ['máy tính', 'laptop', 'pc', 'màn hình', 'bàn phím'],
    asset: {
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80',
      accentColor: '#6366f1',
      bgLight: '#eef2ff',
    },
  },
  {
    keywords: ['thiết bị điện gia dụng', 'gia dụng', 'điện tử', 'quạt', 'nồi chiên', 'máy hút bụi'],
    asset: {
      imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80',
      accentColor: '#f59e0b',
      bgLight: '#fef3c7',
    },
  },
  {
    keywords: ['nhà cửa', 'đời sống', 'nội thất', 'cốc sứ', 'bình giữ nhiệt', 'trang trí'],
    asset: {
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
      accentColor: '#10b981',
      bgLight: '#ecfdf5',
    },
  },
  {
    keywords: ['thời trang', 'phụ kiện', 'quần áo', 'balo', 'túi xách', 'giày'],
    asset: {
      imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80',
      accentColor: '#ec4899',
      bgLight: '#fdf2f8',
    },
  },
  {
    keywords: ['sức khỏe', 'sắc đẹp', 'mỹ phẩm', 'skincare'],
    asset: {
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
      accentColor: '#f43f5e',
      bgLight: '#fff1f2',
    },
  },
  {
    keywords: ['thể thao', 'dã ngoại', 'gym'],
    asset: {
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
      accentColor: '#06b6d4',
      bgLight: '#ecfeff',
    },
  },
  {
    keywords: ['bách hóa', 'thực phẩm', 'đồ ăn'],
    asset: {
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      accentColor: '#84cc16',
      bgLight: '#f7fee7',
    },
  },
  {
    keywords: ['mẹ', 'bé', 'đồ chơi'],
    asset: {
      imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=400&q=80',
      accentColor: '#8b5cf6',
      bgLight: '#f5f3ff',
    },
  },
  {
    keywords: ['sách', 'văn phòng phẩm'],
    asset: {
      imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
      accentColor: '#d97706',
      bgLight: '#fffbeb',
    },
  },
]

const DEFAULT_ASSET: CategoryAsset = {
  imageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80',
  accentColor: '#e11d48',
  bgLight: '#fff1f2',
}

/**
 * Tìm kiếm hình ảnh danh mục phù hợp theo tên hoặc ảnh trực tiếp từ database
 */
export function getCategoryAsset(category: { name?: string; imageUrl?: string }): CategoryAsset {
  if (category.imageUrl && category.imageUrl.trim().length > 0) {
    return {
      imageUrl: category.imageUrl,
      accentColor: DEFAULT_ASSET.accentColor,
      bgLight: DEFAULT_ASSET.bgLight,
    }
  }

  const nameLower = (category.name || '').toLowerCase()
  for (const item of CATEGORY_IMAGE_MAP) {
    if (item.keywords.some((kw) => nameLower.includes(kw))) {
      return item.asset
    }
  }

  return DEFAULT_ASSET
}
