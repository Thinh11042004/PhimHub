import { MovieDetail, MovieProvider, MovieVersion, Subtitle, EpisodeServer } from "../model";
import { http } from '../../../shared/lib/http';

// Using shared Axios baseURL; call relative endpoints

type BackendMovieResponse = {
  success: boolean;
  message: string;
  data: {
    id: number;
    slug: string;
    title: string;
    description?: string;
    release_year?: number;
    duration?: number;
    age_rating?: string;
    thumbnail_url?: string;
    poster_url?: string;
    banner_url?: string;
    trailer_url?: string;
    is_series: boolean;
    status: string;
    external_id?: string;
    tmdb_id?: string;
    imdb_id?: string;
    original_title?: string;
    external_rating?: number;
    external_rating_count?: number;
    external_view_count?: number;
    quality?: string;
    language?: string;
    actors?: Array<{ name: string }>;
    directors?: Array<{ name: string }>;
    genres?: Array<{ name: string }>;
    episodes?: Array<{
      id: number;
      episode_number: number;
      title?: string;
      episode_url?: string;
      server_name?: string;
      ep?: string;
      link_m3u8?: string;
      link_embed?: string;
    }>;
    total_episodes?: number;
  };
};

function mapToMovieDetail(resp: BackendMovieResponse): MovieDetail {
  const data = resp.data;
  
  // Tạo versions từ episodes dựa trên server_name
  const versions: MovieVersion[] = [];
  if (data.episodes && data.episodes.length > 0) {
    // Lấy danh sách server_name duy nhất
    const serverNames = [...new Set(data.episodes.map(ep => ep.server_name).filter(Boolean))];
    
    if (serverNames.length > 0) {
      serverNames.forEach((serverName, index) => {
        versions.push({
          key: `server_${index}`,
          label: serverName || `Server ${index + 1}`,
          note: data.quality || "HD"
        });
      });
    } else {
      // Fallback nếu không có server_name
      versions.push(
        { key: "vietsub", label: "Vietsub", note: data.quality || "HD" },
        { key: "dubbed", label: "Lồng tiếng", note: data.quality || "HD" }
      );
    }
  } else {
    // Phim lẻ
    versions.push(
      { key: "vietsub", label: "Vietsub", note: data.quality || "HD" },
      { key: "dubbed", label: "Lồng tiếng", note: data.quality || "HD" }
    );
  }

  // Tạo subtitles
  const subtitles: Subtitle[] = [
    { label: "Tiếng Việt", lang: "vi", src: "", default: true },
    { label: "English", lang: "en", src: "" }
  ];

  // Xác định isSeries - ưu tiên dữ liệu từ database
  const hasEpisodes = data.episodes && data.episodes.length > 0;
  const isSeries = data.is_series !== undefined ? data.is_series : (hasEpisodes || (data.total_episodes && data.total_episodes > 1));

  // Tạo episodes list cho phim bộ
  const episodes: EpisodeServer[] = [];
  if (isSeries && data.episodes && data.episodes.length > 0) {
    console.log('🎬 Processing episodes:', {
      totalEpisodes: data.episodes.length,
      firstEpisode: data.episodes[0],
      sampleEpisodes: data.episodes.slice(0, 3)
    });
    // Nhóm episodes theo server_name
    const episodesByServer = new Map<string, any[]>();
    
    data.episodes.forEach(ep => {
      const serverName = ep.server_name || "Default Server";
      if (!episodesByServer.has(serverName)) {
        episodesByServer.set(serverName, []);
      }
      episodesByServer.get(serverName)!.push(ep);
    });

    // Tạo EpisodeServer cho mỗi server
    episodesByServer.forEach((serverEpisodes, serverName) => {
      episodes.push({
        server_name: serverName,
        server_slug: serverName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, ''),
        server_data: serverEpisodes.map(ep => {
          // Extract episode number from ep field (e.g., "Tập 03" -> 3)
          const epMatch = ep.ep?.match(/Tập\s*(\d+)/);
          const episodeNum = epMatch ? parseInt(epMatch[1]) : ep.episode_number;
          
          return {
            name: ep.ep || `Tập ${episodeNum}`,
            slug: `tap-${episodeNum}`,
            filename: ep.ep || `Tập ${episodeNum}`,
            link_m3u8: ep.episode_url || ep.link_m3u8 || "",
            link_embed: ep.link_embed || "",
            quality: "HD"
          };
        })
      });
    });
  }

  // Tạo stream URL từ episode đầu tiên hoặc fallback
  const stream = {
    hls: data.episodes && data.episodes.length > 0 
      ? data.episodes[0].episode_url || data.episodes[0].link_m3u8 || "https://www.w3schools.com/html/mov_bbb.mp4"
      : "https://www.w3schools.com/html/mov_bbb.mp4",
    mp4: "https://www.w3schools.com/html/mov_bbb.mp4"
  };

  return {
    id: data.id.toString(),
    title: data.title,
    originalTitle: data.original_title || data.title,
    year: data.release_year || new Date().getFullYear(),
    duration: isSeries ? 0 : (data.duration || 0), // Phim bộ không có duration cố định
    ageRating: data.age_rating || "13+",
    rating: data.external_rating || 0,
    poster: data.poster_url || data.thumbnail_url || "",
    banner: data.banner_url || data.poster_url || data.thumbnail_url || "",
    overview: data.description || "Không có mô tả",
    genres: (data as any).categories ? 
      (typeof (data as any).categories === 'string' && (data as any).categories.startsWith('[') ? 
        JSON.parse((data as any).categories) : 
        (data as any).categories.split(',').map((g: string) => g.trim())) : 
      (data.genres?.map(g => g.name) || []),
    director: data.directors?.map(d => d.name).join(", ") || "",
    cast: data.actors?.map(a => a.name) || [],
    country: (data as any).country || "Việt Nam", // Lấy từ database, fallback về Việt Nam
    studio: "",
    trailer: data.trailer_url || "",
    versions,
    subtitles,
    stream,
    isSeries: Boolean(isSeries),
    episodes: episodes.length > 0 ? episodes : undefined,
    recommendations: [], // Có thể thêm logic lấy recommendations từ backend
  };
}

export class LocalBackendProvider implements MovieProvider {
  async getMovieById(slug: string): Promise<MovieDetail> {
    try {
      const url = `/movies/${encodeURIComponent(slug)}`;
      console.log('🎬 LocalBackend getMovieById:', { slug, url });
      const json: BackendMovieResponse = await http.get(url);
      if (!json?.success) throw new Error(json?.message || 'Lỗi backend');
      return mapToMovieDetail(json);
    } catch (error) {
      console.error('Error fetching movie from backend:', error);
      throw error;
    }
  }

  async updateMovie(movieId: string, updateData: any): Promise<MovieDetail> {
    try {
      const url = `/movies/${movieId}`;
      console.log('🎬 LocalBackend updateMovie:', { movieId, url, updateData });
      const json: BackendMovieResponse = await http.put(url, updateData);
      if (!json?.success) throw new Error(json?.message || 'Lỗi backend');
      return mapToMovieDetail(json);
    } catch (error) {
      console.error('Error updating movie from backend:', error);
      throw error;
    }
  }

  async switchVersion(id: string, versionKey: string) {
    try {
      const json: BackendMovieResponse = await http.get(`/movies/${encodeURIComponent(id)}`);
      if (!json?.success) throw new Error(json?.message || 'Lỗi backend');
      const data = json.data;
      const episodes = data.episodes || [];
      
      // Tìm episode phù hợp với versionKey
      let selectedEpisode = null;
      
      if (versionKey.startsWith('server_')) {
        const serverIndex = parseInt(versionKey.replace('server_', ''));
        const serverNames = [...new Set(episodes.map(ep => ep.server_name).filter(Boolean))];
        const targetServer = serverNames[serverIndex];
        
        if (targetServer) {
          selectedEpisode = episodes.find(ep => ep.server_name === targetServer);
        }
      }
      
      // Fallback: lấy episode đầu tiên
      if (!selectedEpisode && episodes.length > 0) {
        selectedEpisode = episodes[0];
      }
      
      return { 
        hls: selectedEpisode?.link_m3u8 || selectedEpisode?.episode_url || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        subtitles: [
          { label: "Tiếng Việt", lang: "vi", src: "", default: true },
          { label: "English", lang: "en", src: "" }
        ]
      };
    } catch (error) {
      console.error('Error switching version:', error);
      return { 
        hls: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        subtitles: [
          { label: "Tiếng Việt", lang: "vi", src: "", default: true },
          { label: "English", lang: "en", src: "" }
        ]
      };
    }
  }
}
