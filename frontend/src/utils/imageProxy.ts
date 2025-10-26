/**
 * Utility to handle image URLs and proxy them through Vite dev server
 * to avoid CORS issues during development
 */

export function getImageUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  
  // If it's already a full URL or data URL, return as is
  if (originalUrl.startsWith('http://localhost') || 
      originalUrl.startsWith('https://') ||
      originalUrl.startsWith('data:')) {
    return originalUrl;
  }
  
  // If it's a local path starting with /uploads, prepend backend URL
  if (originalUrl.startsWith('/uploads/')) {
    return `http://localhost:3001${originalUrl}`;
  }
  
  // If it's a phimimg.com URL, proxy it through our dev server
  if (originalUrl.includes('phimimg.com')) {
    // Extract the path from the full URL
    const url = new URL(originalUrl);
    return `http://localhost:8080/api/images${url.pathname}${url.search}`;
  }
  
  // For other external URLs, return as is (they might work or might have CORS issues)
  return originalUrl;
}

/**
 * Resolve poster URL with comprehensive fallback logic
 */
export function resolvePoster(m: any): string {
  // Try multiple possible keys for poster/thumbnail
  let url = m?.poster_url || m?.poster || m?.thumbnail_url || m?.thumb_url || m?.thumb || null;
  
  // If no URL found, try TMDB poster_path
  if (!url && m?.tmdb?.poster_path) {
    url = `https://image.tmdb.org/t/p/w500${m.tmdb.poster_path}`;
  }
  
  // If still no URL, return fallback
  if (!url) {
    return '/src/assets/default-poster.jpg';
  }
  
  // If it's already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  // If it's a relative path from backend, make it absolute
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  // In Docker, frontend runs on port 8080 and proxies /uploads/ to backend
  // So we should use the frontend URL, not backend URL
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
  return base + url;
}

/**
 * Get poster URL with fallback (legacy function)
 */
export function getPosterUrl(posterUrl?: string, fallback?: string): string {
  if (posterUrl) {
    return getImageUrl(posterUrl);
  }
  
  if (fallback) {
    return getImageUrl(fallback);
  }
  
  // Default fallback poster
  return '/src/assets/default-poster.jpg';
}

/**
 * Get banner URL with fallback
 */
export function getBannerUrl(bannerUrl?: string, fallback?: string): string {
  if (bannerUrl) {
    return getImageUrl(bannerUrl);
  }
  
  if (fallback) {
    return getImageUrl(fallback);
  }
  
  // Default fallback banner
  return '/src/assets/default-banner.jpg';
}
