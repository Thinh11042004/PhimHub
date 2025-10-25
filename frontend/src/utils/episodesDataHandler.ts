import type { EpisodeServer } from '../services/movies/model';

/**
 * Safely parse server_data which can be an array or JSON string
 */
export const parseServerData = (serverData: any): any[] => {
  if (!serverData) return [];
  if (Array.isArray(serverData)) return serverData;
  if (typeof serverData === 'string') {
    try {
      const parsed = JSON.parse(serverData);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to parse server_data JSON:', error);
      return [];
    }
  }
  return [];
};

/**
 * Get episodes data with fallback logic to handle race conditions
 */
export const getEpisodesData = (detail: any): EpisodeServer[] => {
  // Primary source: detail.episodes
  if (detail?.episodes && detail.episodes.length > 0) {
    return detail.episodes;
  }
  
  // Fallback: Check if we have any server data in detail
  if (detail && typeof detail === 'object') {
    // Look for any server_data in detail object
    const possibleServerData = Object.values(detail).find(value => 
      Array.isArray(value) && value.length > 0 && 
      value.some(item => item.server_name || item.server_slug)
    );
    if (possibleServerData) {
      return [{
        server_name: "Default Server",
        server_slug: "default",
        server_data: possibleServerData
      }];
    }
  }
  
  return [];
};

/**
 * Get active server from episodes data
 */
export const getActiveServer = (episodes: EpisodeServer[], serverKey?: string): EpisodeServer | undefined => {
  if (!episodes || episodes.length === 0) return undefined;
  if (serverKey) return episodes.find((s) => (s.server_slug || s.server_name) === serverKey) || episodes[0];
  return episodes[0];
};

/**
 * Get active episode from server data
 */
export const getActiveEpisode = (
  server: EpisodeServer | undefined, 
  searchParams: URLSearchParams
): any => {
  if (!server) return undefined;
  
  // Parse server_data safely
  const serverData = parseServerData(server.server_data);
  if (serverData.length === 0) return undefined;
  
  // Deduplicate by slug/name to avoid duplicates
  const seen = new Set<string>();
  const list = serverData.filter((e) => {
    const key = e.slug || e.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Check episode parameter (prioritized: ep > episode)
  const currentEpisodeKey = searchParams.get("ep") || searchParams.get("episode");
  if (currentEpisodeKey) {
    const found = list.find((e) => e.slug === currentEpisodeKey);
    if (found) return found;
  }
  
  // Fallback: Check episode number (e=13)
  const episodeNum = searchParams.get("e");
  if (episodeNum) {
    const num = parseInt(episodeNum);
    if (num > 0 && num <= list.length) {
      return list[num - 1];
    }
  }
  
  // No default selection - return undefined to avoid highlighting
  return undefined;
};

/**
 * Get episodes list for rendering with deduplication
 */
export const getEpisodesList = (server: EpisodeServer | undefined): any[] => {
  if (!server) return [];
  
  const serverData = parseServerData(server.server_data);
  const seen = new Set<string>();
  
  return serverData.filter((ep) => {
    const key = ep.slug || ep.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Debug episodes data for troubleshooting
 */
export const debugEpisodesData = (detail: any, episodesData: EpisodeServer[], activeServer: EpisodeServer | undefined, activeEpisode: any) => {
  console.log('🎬 Episodes data debug:', {
    hasDetail: !!detail,
    hasDetailEpisodes: !!detail?.episodes,
    detailEpisodesCount: detail?.episodes?.length || 0,
    episodesDataCount: episodesData.length,
    activeServer: !!activeServer,
    activeServerName: activeServer?.server_name,
    activeServerData: activeServer?.server_data,
    activeServerDataType: typeof activeServer?.server_data,
    activeServerDataLength: Array.isArray(activeServer?.server_data) ? activeServer.server_data.length : 'not array',
    activeEpisode: !!activeEpisode,
    activeEpisodeName: activeEpisode?.name,
    providerStream: !!(activeEpisode?.link_m3u8 || activeEpisode?.file)
  });
};
