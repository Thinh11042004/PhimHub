/**
 * Utility to handle image URLs and proxy them through backend
 * to avoid CORS and SSL certificate issues
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export function getImageUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  
  // If it's already a local URL or data URL, return as is
  if (originalUrl.startsWith('http://localhost') || 
      originalUrl.startsWith('data:') || 
      originalUrl.startsWith('/')) {
    return originalUrl;
  }
  
  // Proxy images from problematic domains through backend
  // This fixes SSL certificate issues (ERR_CERT_AUTHORITY_INVALID)
  const needsProxy = 
    originalUrl.includes('img.phimapi.com') ||
    originalUrl.includes('phimimg.com') ||
    originalUrl.includes('phimapi.com');
  
  if (needsProxy) {
    // Use backend proxy endpoint to avoid SSL/cors issues
    return `${API_BASE}/proxy?url=${encodeURIComponent(originalUrl)}`;
  }
  
  // For other external URLs, return as is
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
