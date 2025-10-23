import { MovieDetail, MovieProvider, MovieVersion, Subtitle, EpisodeServer } from "../model";

const BASE = "https://phimapi.com";

type PhimApiResponse = {
  status: boolean;
  msg?: string;
  movie: {
    id: string;
    name: string;
    original_name?: string;
    slug: string;
    type: string;
    year?: number;
    time?: string;
    episode_total?: number;
    episode_current?: string;
    quality?: string;
    rating?: number;
    poster_url?: string;
    thumb_url?: string;
    content?: string;
    updated_at?: string;
    categories?: Array<{ name: string }>;
    director?: string | string[];
    casts?: string[];
    countries?: Array<{ name: string }>;
    country?: string;
    studio?: string;
    trailer_url?: string;
  };
  episodes?: Array<{
    server_name: string;
    server_slug: string;
    note?: string;
    server_data: Array<{
      name: string;
      slug: string;
      filename: string;
      quality?: string;
      link_m3u8?: string;
      file?: string;
      link_play?: string;
      link_embed?: string;
      updated_at?: string;
    }>;
  }>;
  recommend?: Array<{
    name: string;
    slug: string;
    type: string;
    year?: number;
    thumb_url?: string;
  }>;
};

function pickStream(d: any): { hls?: string; mp4?: string } {
  // Ưu tiên: HLS streams (link_m3u8)
  const m3u8 = d?.link_m3u8 || d?.m3u8 || (typeof d?.file === 'string' && d.file.endsWith('.m3u8') ? d.file : undefined);
  if (m3u8) return { hls: m3u8 };
  
  // Dự phòng: File MP4 trực tiếp
  const file = d?.file && typeof d.file === 'string' && d.file.endsWith('.mp4') ? d.file : undefined;
  if (file) return { mp4: file };
  
  return {};
}

function mapToMovieDetail(resp: PhimApiResponse): MovieDetail {
  const m: PhimApiResponse["movie"] = resp.movie;

  // Xây dựng các phiên bản từ servers với phát hiện chất lượng tốt hơn
  const versions: MovieVersion[] = (resp.episodes || []).map((s) => {
    // Thử lấy chất lượng từ server_data
    const quality = s.server_data?.[0]?.quality;
    const note = quality ? `${s.server_name} (${quality})` : s.server_name;
    
    return {
      key: s.server_slug || s.server_name,
      label: s.server_name || s.server_slug,
      note: quality || s.note,
    };
  });

  // Stream ban đầu: ưu tiên HLS hơn MP4, ưu tiên chất lượng cao hơn
  let init: { hls?: string; mp4?: string } = {};
  const qualityOrder = ['4K', '1080p', '720p', '480p', '360p'];
  
  for (const quality of qualityOrder) {
    for (const s of resp.episodes || []) {
      for (const d of s.server_data || []) {
        if (d.quality === quality) {
          const st = pickStream(d);
          if (st.hls || st.mp4) {
            init = st;
            break;
          }
        }
      }
      if (init.hls || init.mp4) break;
    }
    if (init.hls || init.mp4) break;
  }

  // Nếu không có match theo chất lượng, dự phòng về stream đầu tiên có sẵn
  if (!init.hls && !init.mp4) {
    for (const s of resp.episodes || []) {
      for (const d of s.server_data || []) {
        const st = pickStream(d);
        if (st.hls || st.mp4) {
          init = st;
          break;
        }
      }
      if (init.hls || init.mp4) break;
    }
  }

  // Đề xuất với mapping tốt hơn
  const recs = (resp.recommend || []).map((r, i) => ({
    id: r.slug || String(i),
    title: r.name || "Đề xuất",
    img: r.thumb_url || "",
  }));

  const normalizedType = String(m.type || "").toLowerCase();
  const episodesCount = (resp.episodes || []).reduce((sum, s) => sum + (s.server_data?.length || 0), 0);

  return {
    id: m.slug || m.id || "",
    title: m.name || "",
    originalTitle: m.original_name,
    // Consider series only when provider marks it as series-like explicitly,
    // or when type is missing and there are more than 1 episode
    isSeries: normalizedType === "series" || normalizedType === "tv" || normalizedType === "season" || (!normalizedType && episodesCount > 1) || false,
    year: m.year,
    duration: m.time ? parseInt(m.time.match(/(\d+)\s*phút/i)?.[1] || "0") : undefined,
    ageRating: m.quality,
    rating: m.rating,
    poster: m.poster_url,
    banner: m.thumb_url || m.poster_url,
    overview: m.content,
    genres: m.categories?.map((c) => c.name).filter(Boolean),
    // Thông tin chi tiết bổ sung
    director: Array.isArray(m.director) ? m.director.join(", ") : m.director,
    cast: m.casts,
    country: m.countries?.map((c) => c.name).join(", ") || m.country,
    studio: m.studio,
    trailer: m.trailer_url,
    versions,
    subtitles: undefined as Subtitle[] | undefined,
    stream: init,
    episodes: resp.episodes as EpisodeServer[],
    recommendations: recs,
  };
}

export class PhimApiProvider implements MovieProvider {
  async getMovieById(slug: string): Promise<MovieDetail> {
    const res = await fetch(`${BASE}/phim/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`PhimAPI HTTP ${res.status}`);
    const json: PhimApiResponse = await res.json();
    if (!json?.status) throw new Error(json?.msg || 'Lỗi PhimAPI');
    return mapToMovieDetail(json);
  }

  /**
   * Lấy các chất lượng có sẵn cho server/phiên bản cụ thể
   */
  async getAvailableQualities(slug: string, versionKey: string): Promise<string[]> {
    const res = await fetch(`${BASE}/phim/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`PhimAPI HTTP ${res.status}`);
    const json: PhimApiResponse = await res.json();
    
    if (!json.status) throw new Error(json.msg || 'Lỗi PhimAPI');
    
    const server = (json.episodes || []).find((s) => (s.server_slug || s.server_name) === versionKey);
    if (!server) return [];
    
    const qualities = server.server_data
      ?.map(d => d.quality)
      .filter((quality): quality is string => Boolean(quality))
      .filter((quality, index, arr) => arr.indexOf(quality) === index) || [];
    
    return qualities;
  }

  /**
   * Lấy URL stream trực tiếp cho chất lượng cụ thể
   */
  async getStreamUrl(slug: string, versionKey: string, quality?: string): Promise<{ hls?: string; mp4?: string }> {
    const res = await fetch(`${BASE}/phim/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`PhimAPI HTTP ${res.status}`);
    const json: PhimApiResponse = await res.json();
    
    if (!json.status) throw new Error(json.msg || 'Lỗi PhimAPI');
    
    const server = (json.episodes || []).find((s) => (s.server_slug || s.server_name) === versionKey);
    if (!server) return {};
    
    // Nếu yêu cầu chất lượng cụ thể, tìm nó
    if (quality) {
      const data = server.server_data?.find(d => d.quality === quality);
      if (data) return pickStream(data);
    }
    
    // Nếu không, sử dụng logic chọn chất lượng
    const qualityOrder = ['4K', '1080p', '720p', '480p', '360p'];
    
    for (const q of qualityOrder) {
      const data = server.server_data?.find(d => d.quality === q);
      if (data) {
        const stream = pickStream(data);
        if (stream.hls || stream.mp4) return stream;
      }
    }
    
    // Dự phòng về stream đầu tiên có sẵn
    const firstData = server.server_data?.[0];
    return firstData ? pickStream(firstData) : {};
  }

  async switchVersion(slug: string, versionKey: string) {
    const res = await fetch(`${BASE}/phim/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`PhimAPI HTTP ${res.status}`);
    const json: PhimApiResponse = await res.json();
    
    if (!json.status) throw new Error(json.msg || 'Lỗi PhimAPI');
    
    const server = (json.episodes || []).find((s) => (s.server_slug || s.server_name) === versionKey) || (json.episodes || [])[0];
    if (!server) return {};
    
    // Thử tìm stream chất lượng tốt nhất cho server này
    const qualityOrder = ['4K', '1080p', '720p', '480p', '360p'];
    
    for (const quality of qualityOrder) {
      for (const d of server.server_data || []) {
        if (d.quality === quality) {
          const st = pickStream(d);
          if (st.hls || st.mp4) return st;
        }
      }
    }
    
    // Dự phòng về stream đầu tiên có sẵn
    for (const d of server.server_data || []) {
      const st = pickStream(d);
      if (st.hls || st.mp4) return st;
    }
    
    return {};
  }
}


