// Utility functions for handling avatar URLs
import { getImageUrl } from './imageProxy';

// Get backend base URL (without /api)
const getBackendBaseUrl = (): string => {
  const apiBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  // Remove /api suffix if present
  return apiBase.replace(/\/api$/, '');
};

/**
 * Get the full avatar URL from avatar path
 * @param avatarPath - The avatar path from database (e.g., "/uploads/avatars/avatar-123.jpg")
 * @returns Full URL to the avatar image
 */
export const getAvatarUrl = (avatarPath?: string): string => {
  if (!avatarPath) {
    return '';
  }
  
  // If it's a local upload path (starts with /uploads/), convert to full backend URL
  if (avatarPath.startsWith('/uploads/')) {
    const backendBase = getBackendBaseUrl();
    return `${backendBase}${avatarPath}`;
  }
  
  // Use getImageUrl to proxy external images (fixes SSL issues)
  return getImageUrl(avatarPath);
};

/**
 * Get avatar URL with fallback to default avatar
 * @param avatarPath - The avatar path from database
 * @param defaultAvatar - Default avatar URL to use as fallback
 * @returns Avatar URL or default avatar
 */
export const getAvatarUrlWithFallback = (avatarPath?: string, defaultAvatar?: string): string => {
  if (!avatarPath) {
    return defaultAvatar || '';
  }
  
  return getAvatarUrl(avatarPath);
};
