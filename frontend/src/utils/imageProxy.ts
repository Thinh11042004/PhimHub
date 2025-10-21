/**
 * Utility to handle image URLs and proxy them through Vite dev server
 * to avoid CORS issues during development
 */

export function getImageUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  
  // If it's already a local URL or data URL, return as is
  if (originalUrl.startsWith('http://localhost') || 
      originalUrl.startsWith('data:') || 
      originalUrl.startsWith('/')) {
    return originalUrl;
  }
  
  // If it's a phimimg.com URL, proxy it through our dev server
  if (originalUrl.includes('phimimg.com')) {
    // Extract the path from the full URL
    const url = new URL(originalUrl);
    return `/api/images${url.pathname}${url.search}`;
  }
  
  // For other external URLs, return as is (they might work or might have CORS issues)
  return originalUrl;
}

/**
 * Get poster URL with fallback
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
