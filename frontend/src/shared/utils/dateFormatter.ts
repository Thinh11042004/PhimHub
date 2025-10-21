/**
 * Format date to Vietnamese locale using proper timezone handling
 * No manual timezone conversion - let Intl.DateTimeFormat handle it
 */

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use Intl.DateTimeFormat with Asia/Ho_Chi_Minh timezone
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(dateObj);
};

export const formatDateShort = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Use Intl.DateTimeFormat with Asia/Ho_Chi_Minh timezone
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(dateObj);
};

export const formatTimeAgo = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Calculate difference in milliseconds (no timezone conversion needed)
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  
  return formatDateShort(dateObj);
};

export const getCurrentVietnamTime = (): string => {
  const now = new Date();
  
  // Use Intl.DateTimeFormat with Asia/Ho_Chi_Minh timezone
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(now);
};

/**
 * Normalize epoch timestamp to milliseconds
 * @param timestamp - Timestamp in seconds or milliseconds
 * @returns Timestamp in milliseconds
 */
export const normalizeEpochMs = (timestamp: number): number => {
  // If timestamp is 10 digits, it's in seconds, convert to milliseconds
  return String(Math.abs(timestamp)).length === 10 ? timestamp * 1000 : timestamp;
};
