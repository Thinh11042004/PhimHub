// Genre slug to display name mapping
const genreMap: Record<string, string> = {
  'chinh-kich': 'Chính kịch',
  'tinh-cam': 'Tình cảm',
  'hai-huoc': 'Hài hước',
  'hanh-dong': 'Hành động',
  'kinh-di': 'Kinh dị',
  'vien-tuong': 'Viễn tưởng',
  'tai-lieu': 'Tài liệu',
  'hoi-ky': 'Hồi ký',
  'phieu-luu': 'Phiêu lưu',
  'gia-dinh': 'Gia đình',
  'the-thao': 'Thể thao',
  'am-nhac': 'Âm nhạc',
  'thieu-nhi': 'Thiếu nhi',
  'lich-su': 'Lịch sử',
  'chien-tranh': 'Chiến tranh',
  'tam-ly': 'Tâm lý',
  'hinh-su': 'Hình sự',
  'toi-pham': 'Tội phạm',
  'bi-an': 'Bí ẩn',
  'lang-man': 'Lãng mạn',
  'co-trang': 'Cổ trang',
  'hien-dai': 'Hiện đại',
  'tuong-lai': 'Tương lai',
  'qua-khu': 'Quá khứ',
  'dong-vat': 'Động vật',
  'thien-nhien': 'Thiên nhiên',
  'khoa-hoc': 'Khoa học',
  'cong-nghe': 'Công nghệ',
  'giao-duc': 'Giáo dục',
  'suc-khoe': 'Sức khỏe',
  'du-lich': 'Du lịch',
  'nau-an': 'Nấu ăn',
  'lam-dep': 'Làm đẹp',
  'thoi-trang': 'Thời trang',
  'the-duc': 'Thể dục',
  'game': 'Trò chơi',
  'anime': 'Anime',
  'manga': 'Manga',
  'dong-hoa': 'Động họa',
  '3d': '3D',
  '2d': '2D',
  'live-action': 'Live action',
  'stop-motion': 'Stop motion',
  'claymation': 'Claymation',
  'puppet': 'Múa rối',
  'musical': 'Nhạc kịch',
  'opera': 'Opera',
  'ballet': 'Ballet',
  'dance': 'Nhảy múa',
  'comedy': 'Hài kịch',
  'drama': 'Chính kịch',
  'romance': 'Lãng mạn',
  'action': 'Hành động',
  'horror': 'Kinh dị',
  'thriller': 'Giật gân',
  'sci-fi': 'Khoa học viễn tưởng',
  'fantasy': 'Fantasy',
  'adventure': 'Phiêu lưu',
  'family': 'Gia đình',
  'sport': 'Thể thao',
  'music': 'Âm nhạc',
  'children': 'Thiếu nhi',
  'history': 'Lịch sử',
  'war': 'Chiến tranh',
  'psychological': 'Tâm lý',
  'crime': 'Tội phạm',
  'mystery': 'Bí ẩn',
  'period': 'Cổ trang',
  'modern': 'Hiện đại',
  'future': 'Tương lai',
  'past': 'Quá khứ',
  'animal': 'Động vật',
  'nature': 'Thiên nhiên',
  'science': 'Khoa học',
  'technology': 'Công nghệ',
  'education': 'Giáo dục',
  'health': 'Sức khỏe',
  'travel': 'Du lịch',
  'cooking': 'Nấu ăn',
  'beauty': 'Làm đẹp',
  'fashion': 'Thời trang',
  'fitness': 'Thể dục',
  'gaming': 'Trò chơi'
};

/**
 * Convert genre slug to display name
 * @param slug - Genre slug (e.g., 'chinh-kich')
 * @returns Display name (e.g., 'chính kịch')
 */
export function getGenreDisplayName(slug: string): string {
  if (!slug) return '';
  
  // Return mapped name if exists, otherwise return original slug
  return genreMap[slug.toLowerCase()] || slug;
}

/**
 * Convert array of genre slugs to display names
 * @param slugs - Array of genre slugs
 * @returns Array of display names
 */
export function getGenreDisplayNames(slugs: string[]): string[] {
  if (!Array.isArray(slugs)) return [];
  
  return slugs.map(slug => getGenreDisplayName(slug)).filter(Boolean);
}

/**
 * Convert genre object to display name
 * @param genre - Genre object with name/slug property
 * @returns Display name
 */
export function getGenreDisplayNameFromObject(genre: any): string {
  if (!genre) return '';
  
  if (typeof genre === 'string') {
    return getGenreDisplayName(genre);
  }
  
  if (typeof genre === 'object') {
    const slug = genre.slug || genre.name || genre.title || '';
    return getGenreDisplayName(slug);
  }
  
  return '';
}
