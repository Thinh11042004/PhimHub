// Utility functions for handling avatar URLs

/**
 * Get the full avatar URL from avatar path
 * @param avatarPath - The avatar path from database (e.g., "/uploads/avatars/avatar-123.jpg")
 * @returns Full URL to the avatar image
 */
export const getAvatarUrl = (avatarPath?: string): string => {
  if (!avatarPath) {
    return '';
  }
  
  // If it's already a full URL (starts with http), return as is
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  // If it's a relative path, prepend the backend URL
  return `http://localhost:3001${avatarPath}`;
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
