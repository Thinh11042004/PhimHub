/**
 * Time utility functions for consistent UTC handling
 */

/**
 * Convert any date value to ISO UTC string with 'Z' suffix
 * @param value - Date object, string, or timestamp
 * @returns ISO UTC string (e.g., "2025-10-17T13:24:57.000Z")
 */
export function toIsoUtc(value: any): string {
  if (!value) return '';
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', value);
      return '';
    }
    return date.toISOString(); // Always includes 'Z' for UTC
  } catch (error) {
    console.warn('Error converting to ISO UTC:', error);
    return '';
  }
}

/**
 * Map comment row to ensure all timestamps are ISO UTC
 * @param row - Database row object
 * @returns Mapped object with ISO UTC timestamps
 */
export function mapCommentRow(row: any): any {
  return {
    id: row.id,
    content: row.content,
    created_at: toIsoUtc(row.created_at),
    updated_at: row.updated_at ? toIsoUtc(row.updated_at) : null,
    user_id: row.user_id,
    username: row.username,
    fullname: row.fullname,
    avatar: row.avatar,
    parent_id: row.parent_id,
    // Include any other fields as needed
    ...row
  };
}

/**
 * Map external comment row to ensure all timestamps are ISO UTC
 * @param row - Database row object
 * @returns Mapped object with ISO UTC timestamps
 */
export function mapExternalCommentRow(row: any): any {
  return {
    id: row.id,
    ext_key: row.ext_key,
    content: row.content,
    created_at: toIsoUtc(row.created_at),
    updated_at: row.updated_at ? toIsoUtc(row.updated_at) : null,
    user_id: row.user_id,
    username: row.username,
    fullname: row.fullname,
    avatar: row.avatar,
    parent_id: row.parent_id,
    // Include any other fields as needed
    ...row
  };
}

/**
 * Normalize epoch timestamp to milliseconds
 * @param timestamp - Timestamp in seconds or milliseconds
 * @returns Timestamp in milliseconds
 */
export function normalizeEpochMs(timestamp: number): number {
  // If timestamp is 10 digits, it's in seconds, convert to milliseconds
  return String(Math.abs(timestamp)).length === 10 ? timestamp * 1000 : timestamp;
}

/**
 * Get current timestamp in milliseconds
 * @returns Current timestamp in milliseconds
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}
