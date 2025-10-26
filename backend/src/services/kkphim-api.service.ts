import axios from 'axios';

// Types for KKPhim API response
export interface KKPhimMovie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  content: string;
  type: string;
  status: string;
  poster_url: string;
  thumb_url: string;
  is_copyright: boolean;
  sub_docquyen: boolean;
  chieurap: boolean;
  trailer_url: string;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  notify: string;
  showtimes: string;
  year: number;
  view: number;
  actor: string[];
  director: string[];
  category: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  country: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  tmdb?: {
    type: string;
    id: string;
    season?: number;
    vote_average?: number;
    vote_count?: number;
  };
  imdb?: {
    id: string | null;
  };
  created?: {
    time: string;
  };
  modified?: {
    time: string;
  };
}

export interface KKPhimListResponse {
  status: boolean;
  msg: string;
  data: {
    seoOnPage: {
      og_type: string;
      titleHead: string;
      descriptionHead: string;
      og_image: string[];
      og_url: string;
    };
    breadCrumb: Array<{
      name: string;
      slug?: string;
      isCurrent?: boolean;
    }>;
    titlePage: string;
    items: KKPhimMovie[];
    params: {
      type_slug: string;
      filterCategory: string[];
      filterCountry: string[];
      filterYear: string;
      filterType: string;
      sortField: string;
      sortType: string;
      pagination: {
        totalItems: number;
        totalItemsPerPage: number;
        currentPage: number;
        totalPages: number;
      };
    };
  };
}

export interface KKPhimDetailResponse {
  status: boolean;
  msg: string;
  movie: KKPhimMovie;
  episodes: Array<{
    server_name: string;
    server_data: Array<{
      name: string;
      slug: string;
      filename: string;
      link_embed: string;
      link_m3u8: string;
    }>;
  }>;
}

export class KKPhimAPIService {
  private readonly baseURL = 'https://phimapi.com';

  /**
   * Normalize image URL to ensure proper format
   */
  private normalizeImageUrl(u: string | null | undefined, baseHostForRelative = "https://kkphim.men"): string | null {
    if (!u) return null;
    u = String(u).trim();
    
    // Return null if empty after trimming
    if (!u) return null;

    // Nếu lỡ gắn phimimg.com rồi thì bỏ phần proxy đi để lấy URL gốc
    const PHIMIMG = "phimimg.com/";
    const idx = u.indexOf(PHIMIMG);
    if (idx !== -1) {
      const tail = u.slice(idx + PHIMIMG.length);
      if (/^https?:\/\//i.test(tail)) u = tail; // dạng https://phimimg.com/https://xxx
    }

    // Fix dạng //cdn/... -> thêm scheme
    if (u.startsWith("//")) u = "https:" + u;

    // Nếu là relative path -> gắn base (site gốc) hoặc để proxy lo
    if (!/^https?:\/\//i.test(u)) {
      if (!u.startsWith("/")) u = "/" + u;
      return `${baseHostForRelative}${u}`;
    }

    // Ưu tiên https
    if (u.startsWith("http://")) u = "https://" + u.slice(7);

    return u;
  }

  /** Perform GET with fallback endpoints */
  private async requestWithFallback<T>(paths: string[], params?: any): Promise<T> {
    let lastErr: any;
    for (const p of paths) {
      const url = `${this.baseURL}${p}`;
      try {
        console.log(`[kkphim] GET ${url}${params ? `?${new URLSearchParams(params).toString()}` : ''}`);
        const resp = await axios.get(url, {
          params,
          timeout: 15000,
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            'Referer': `${this.baseURL}/`,
            'Origin': this.baseURL,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          },
          validateStatus: (status) => status >= 200 && status < 400
        });
        return resp.data as T;
      } catch (e: any) {
        lastErr = e;
        console.warn(`[kkphim] endpoint failed: ${url} -> ${(e?.response && e.response.status) || e.message}`);
      }
    }
    throw lastErr || new Error('All endpoints failed');
  }

  /**
   * Fetch latest movies list from KKPhim API
   */
  async getLatestMovies(page: number = 1, version: string = 'v1'): Promise<KKPhimListResponse> {
    try {
      const suffix = version === 'v2' ? '-v2' : (version === 'v3' ? '-v3' : '');
      const tryPaths = [
        `/danh-sach/phim-moi-cap-nhat${suffix}`,
        `/v1/api/danh-sach/phim-moi-cap-nhat${suffix}`,
        // Common category fallbacks
        `/danh-sach/phim-le${suffix}`,
        `/v1/api/danh-sach/phim-le${suffix}`,
        `/danh-sach/phim-bo${suffix}`,
        `/v1/api/danh-sach/phim-bo${suffix}`
      ];

      let lastNormalized: KKPhimListResponse | null = null;

      for (const p of tryPaths) {
        const raw: any = await this.requestWithFallback<any>([p], { page });
        const items = raw?.data?.items ?? raw?.items ?? [];
        const pagination = raw?.data?.params?.pagination ?? raw?.params?.pagination ?? {
          totalItems: Array.isArray(items) ? items.length : 0,
          totalItemsPerPage: Array.isArray(items) ? items.length : 0,
          currentPage: page,
          totalPages: 1
        };

        const normalized: KKPhimListResponse = {
          status: raw?.status ?? true,
          msg: raw?.msg ?? 'ok',
          data: {
            seoOnPage: raw?.data?.seoOnPage ?? {
              og_type: 'website',
              titleHead: '',
              descriptionHead: '',
              og_image: [],
              og_url: ''
            },
            breadCrumb: raw?.data?.breadCrumb ?? [],
            titlePage: raw?.data?.titlePage ?? '',
            items,
            params: {
              type_slug: raw?.data?.params?.type_slug ?? '',
              filterCategory: raw?.data?.params?.filterCategory ?? [],
              filterCountry: raw?.data?.params?.filterCountry ?? [],
              filterYear: raw?.data?.params?.filterYear ?? '',
              filterType: raw?.data?.params?.filterType ?? '',
              sortField: raw?.data?.params?.sortField ?? '',
              sortType: raw?.data?.params?.sortType ?? '',
              pagination
            }
          }
        };

        lastNormalized = normalized;
        if (Array.isArray(items) && items.length > 0) {
          return normalized;
        }
      }

      // Return last normalized (possibly empty) if all attempts have no items
      return lastNormalized || { status: true, msg: 'ok', data: { seoOnPage: { og_type: 'website', titleHead: '', descriptionHead: '', og_image: [], og_url: '' }, breadCrumb: [], titlePage: '', items: [], params: { type_slug: '', filterCategory: [], filterCountry: [], filterYear: '', filterType: '', sortField: '', sortType: '', pagination: { totalItems: 0, totalItemsPerPage: 0, currentPage: page, totalPages: 1 } } } };
    } catch (error) {
      console.error('Error fetching latest movies from KKPhim API:', error);
      throw new Error(`Failed to fetch latest movies (page ${page}, version ${version})`);
    }
  }

  /**
   * Fetch movie details by slug from KKPhim API
   */
  async getMovieBySlug(slug: string): Promise<KKPhimDetailResponse> {
    try {
      // Single stable endpoint currently
      return await this.requestWithFallback<KKPhimDetailResponse>([`/phim/${encodeURIComponent(slug)}`]);
    } catch (error) {
      console.error('Error fetching movie details from KKPhim API:', error);
      throw new Error(`Failed to fetch movie details: ${slug}`);
    }
  }

  /**
   * Search movies from KKPhim API (try multiple endpoints) – normalized shape
   */
  async searchMovies(query: string, page: number = 1): Promise<KKPhimListResponse> {
    try {
      const params = { keyword: query, page } as const;
      const raw: any = await this.requestWithFallback<any>([
        '/v1/api/tim-kiem',
        '/tim-kiem'
      ], params);

      // Normalize
      const items = raw?.data?.items ?? raw?.items ?? [];
      const pagination = raw?.data?.params?.pagination ?? raw?.params?.pagination ?? {
        totalItems: items.length,
        totalItemsPerPage: items.length,
        currentPage: page,
        totalPages: 1
      };

      return {
        status: raw?.status ?? true,
        msg: raw?.msg ?? 'ok',
        data: {
          seoOnPage: raw?.data?.seoOnPage ?? {
            og_type: 'website',
            titleHead: '',
            descriptionHead: '',
            og_image: [],
            og_url: ''
          },
          breadCrumb: raw?.data?.breadCrumb ?? [],
          titlePage: raw?.data?.titlePage ?? '',
          items,
          params: {
            type_slug: raw?.data?.params?.type_slug ?? '',
            filterCategory: raw?.data?.params?.filterCategory ?? [],
            filterCountry: raw?.data?.params?.filterCountry ?? [],
            filterYear: raw?.data?.params?.filterYear ?? '',
            filterType: raw?.data?.params?.filterType ?? '',
            sortField: raw?.data?.params?.sortField ?? '',
            sortType: raw?.data?.params?.sortType ?? '',
            pagination
          }
        }
      } as KKPhimListResponse;
    } catch (error) {
      console.error('Error searching movies from KKPhim API:', (error as any)?.message || error);
      throw new Error(`Failed to search movies: ${query}`);
    }
  }

  /**
   * Transform KKPhim movie data to our database format
   */
  transformKKPhimToMovie(movie: KKPhimMovie, episodeData?: any[]) {
    // Generate slug from name if not present
    const slug = movie.slug || this.generateSlug(movie.name);
    
    // Extract episode count
    const episodeCount = parseInt(movie.episode_total?.replace(/\D/g, '') || '0') || 1;
    const currentEpisode = parseInt(movie.episode_current?.replace(/\D/g, '') || '0') || 1;
    
    // Determine if it's a series
    const isSeries = movie.type === 'series' || episodeCount > 1;
    
    // Extract actors and directors
    const actors = Array.isArray(movie.actor) ? movie.actor : [];
    const directors = Array.isArray(movie.director) ? movie.director : [];
    
    // Extract genres
    const genres = Array.isArray(movie.category) ? 
      movie.category.map(cat => ({
        name: cat.name,
        slug: cat.slug
      })) : [];
    
    // Extract countries
    const countries = Array.isArray(movie.country) ? 
      movie.country.map(country => ({
        name: country.name,
        slug: country.slug
      })) : [];

    // Transform episodes data if available
    const episodes = episodeData ? this.transformEpisodesData(episodeData) : [];

    // Build transformed movie object expected by MovieImportService
    return {
      slug,
      title: movie.name,
      original_title: movie.origin_name || null,
      description: movie.content || null,
      release_year: movie.year || null,
      duration: this.parseDuration(movie.time) || null,
      age_rating: null,
      // Keep thumbnail as thumb_url and banner as poster_url (API naming is swapped)
      // Normalize image URLs before saving
      remote_thumbnail_url: this.normalizeImageUrl(movie.thumb_url),
      remote_banner_url: this.normalizeImageUrl(movie.poster_url),
      thumbnail_url: null, // local path after download, leave empty during import
      banner_url: null, // local path after download, leave empty during import
      trailer_url: movie.trailer_url || null,
      is_series: isSeries,
      status: (movie.status === 'completed' ? 'published' : 'draft') as 'published' | 'draft' | 'archived',
      external_id: movie._id || null,
      tmdb_id: movie.tmdb?.id || null,
      imdb_id: movie.imdb?.id || null,
      external_rating: movie.tmdb?.vote_average || null,
      external_rating_count: movie.tmdb?.vote_count || null,
      external_view_count: movie.view || 0,
      quality: movie.quality || null,
      language: movie.lang || null,

      // Lists
      actors: actors,
      directors: directors,
      genres: genres,
      countries: countries,

      // Episodes
      episodes: episodes,
      total_episodes: episodes.length || episodeCount
    };
  }

  /**
   * Transform episode data from KKPhim format
   */
  private transformEpisodesData(episodeServers: any[]): any[] {
    const byNumber: Map<number, any> = new Map();

    const parseEpisodeNumber = (name: string, fallbackIndex: number) => {
      // Try to extract number from strings like "Tập 1", "Ep 02", "Full" -> 1
      const m = String(name || '').match(/(\d{1,3})/);
      if (m) return parseInt(m[1], 10);
      return fallbackIndex + 1;
    };

    episodeServers.forEach((server, serverIndex) => {
      const data = Array.isArray(server?.server_data) ? server.server_data : [];
      data.forEach((ep: any, idx: number) => {
        const epNum = parseEpisodeNumber(ep?.name, idx);
        const candidate = {
          episode_number: epNum,
          title: ep?.name || `Tập ${epNum}`,
          slug: ep?.slug || `tap-${epNum}`,
          filename: ep?.filename || '',
          episode_url: ep?.link_m3u8 || ep?.link_embed || '',
          embed_url: ep?.link_embed || '',
          server_name: server?.server_name || `Server ${serverIndex + 1}`
        };

        if (!byNumber.has(epNum)) {
          byNumber.set(epNum, candidate);
        } else {
          // Prefer entry that has m3u8 link, otherwise keep existing
          const existing = byNumber.get(epNum);
          const existingHasM3u8 = !!existing.episode_url && existing.episode_url.endsWith('.m3u8');
          const candidateHasM3u8 = !!candidate.episode_url && candidate.episode_url.endsWith('.m3u8');
          if (!existingHasM3u8 && candidateHasM3u8) {
            byNumber.set(epNum, candidate);
          }
        }
      });
    });

    // Sort by episode_number ascending
    return Array.from(byNumber.values()).sort((a, b) => a.episode_number - b.episode_number);
  }

  /**
   * Generate slug from movie name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Parse duration string to minutes
   */
  private parseDuration(timeString: string): number | null {
    if (!timeString) return null;
    
    // Try to extract minutes from formats like "120 phút", "2h 30m", etc.
    const minuteMatch = timeString.match(/(\d+)\s*(?:phút|min|minutes?)/i);
    if (minuteMatch) {
      return parseInt(minuteMatch[1]);
    }
    
    // Try to extract hours and minutes
    const hourMinuteMatch = timeString.match(/(\d+)h?\s*(\d+)?m?/i);
    if (hourMinuteMatch) {
      const hours = parseInt(hourMinuteMatch[1]);
      const minutes = parseInt(hourMinuteMatch[2] || '0');
      return hours * 60 + minutes;
    }
    
    return null;
  }
}
