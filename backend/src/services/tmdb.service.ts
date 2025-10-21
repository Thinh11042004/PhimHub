import axios from 'axios';

type TMDBSearchResult = {
  id: number;
  title?: string;
  name?: string;
  first_air_date?: string;
  release_date?: string;
};

type TMDBCast = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string;
};

type TMDBCrew = {
  id: number;
  name: string;
  job?: string;
};

export type TmdbCredits = {
  cast: TMDBCast[];
  crew: TMDBCrew[];
};

/**
 * Lightweight TMDB client encapsulating auth and basic endpoints.
 * Uses axios (shared HTTP client in project) for consistency and to reduce deps.
 */
export class TMDbService {
  private apiKey: string | undefined;
  private readToken: string | undefined;
  private baseUrl = 'https://api.themoviedb.org/3';

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.readToken = process.env.TMDB_READ_TOKEN;
  }

  /**
   * Build authorization headers. Prioritize Bearer token; fallback to api_key query param.
   */
  private authHeaders() {
    if (this.readToken) {
      return { Authorization: `Bearer ${this.readToken}` };
    }
    return {} as Record<string, string>;
  }

  /**
   * GET helper that injects auth (Bearer header or api_key query).
   */
  private async getJson<T>(url: string): Promise<T> {
    let finalUrl = url;
    const headers = this.authHeaders();

    if (!this.readToken && this.apiKey) {
      const sep = url.includes('?') ? '&' : '?';
      finalUrl = `${url}${sep}api_key=${this.apiKey}`;
    }

    const res = await axios.get<T>(finalUrl, { headers });
    return res.data;
  }

  /**
   * Search a movie by title/year
   */
  async searchMovie(title: string, year?: number, language = 'vi-VN'): Promise<TMDBSearchResult | null> {
    const q = encodeURIComponent(title);
    const y = year ? `&year=${year}` : '';
    const data = await this.getJson<{ results: TMDBSearchResult[] }>(
      `${this.baseUrl}/search/movie?query=${q}${y}&language=${language}`
    );
    return data.results?.[0] || null;
  }

  /**
   * Search a TV show by name/firstAirYear
   */
  async searchTV(name: string, firstYear?: number, language = 'vi-VN'): Promise<TMDBSearchResult | null> {
    const q = encodeURIComponent(name);
    const y = firstYear ? `&first_air_date_year=${firstYear}` : '';
    const data = await this.getJson<{ results: TMDBSearchResult[] }>(
      `${this.baseUrl}/search/tv?query=${q}${y}&language=${language}`
    );
    return data.results?.[0] || null;
  }

  /**
   * Get movie full credits (cast/crew)
   */
  async getMovieCredits(id: number, language = 'vi-VN'): Promise<TmdbCredits> {
    return await this.getJson<TmdbCredits>(`${this.baseUrl}/movie/${id}/credits?language=${language}`);
  }

  /**
   * Get TV aggregate credits (better for series)
   */
  async getTVCredits(id: number, language = 'vi-VN'): Promise<TmdbCredits> {
    return await this.getJson<TmdbCredits>(`${this.baseUrl}/tv/${id}/aggregate_credits?language=${language}`);
  }

  /**
   * Get movie details
   */
  async getMovieDetails(id: number, language = 'vi-VN'): Promise<any> {
    return await this.getJson<any>(`${this.baseUrl}/movie/${id}?language=${language}`);
  }

  /**
   * Get TV details
   */
  async getTVDetails(id: number, language = 'vi-VN'): Promise<any> {
    return await this.getJson<any>(`${this.baseUrl}/tv/${id}?language=${language}`);
  }
}

