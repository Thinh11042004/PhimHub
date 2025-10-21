import fetch from 'node-fetch';

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

export class TMDbService {
  private apiKey: string | undefined;
  private readToken: string | undefined;
  private baseUrl = 'https://api.themoviedb.org/3';

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.readToken = process.env.TMDB_READ_TOKEN;
  }

  private authHeaders() {
    if (this.readToken) {
      return { Authorization: `Bearer ${this.readToken}` } as any;
    }
    return {} as any;
  }

  private async getJson<T>(url: string): Promise<T> {
    let finalUrl = url;
    const headers = this.authHeaders();
    
    // If using Bearer token, don't add api_key to URL
    if (this.readToken) {
      // Use Bearer token
    } else if (this.apiKey) {
      // Use API key in URL
      const sep = url.includes('?') ? '&' : '?';
      finalUrl = `${url}${sep}api_key=${this.apiKey}`;
    }
    
    const res = await fetch(finalUrl, { headers });
    if (!res.ok) throw new Error(`TMDb request failed ${res.status}`);
    return (await res.json()) as T;
  }

  async searchMovie(title: string, year?: number, language = 'vi-VN'): Promise<TMDBSearchResult | null> {
    const q = encodeURIComponent(title);
    const y = year ? `&year=${year}` : '';
    const data = await this.getJson<{ results: TMDBSearchResult[] }>(`${this.baseUrl}/search/movie?query=${q}${y}&language=${language}`);
    return data.results?.[0] || null;
  }

  async searchTV(name: string, firstYear?: number, language = 'vi-VN'): Promise<TMDBSearchResult | null> {
    const q = encodeURIComponent(name);
    const y = firstYear ? `&first_air_date_year=${firstYear}` : '';
    const data = await this.getJson<{ results: TMDBSearchResult[] }>(`${this.baseUrl}/search/tv?query=${q}${y}&language=${language}`);
    return data.results?.[0] || null;
  }

  async getMovieCredits(id: number, language = 'vi-VN'): Promise<TmdbCredits> {
    return await this.getJson<TmdbCredits>(`${this.baseUrl}/movie/${id}/credits?language=${language}`);
  }

  async getTVCredits(id: number, language = 'vi-VN'): Promise<TmdbCredits> {
    // Use aggregate_credits for series
    return await this.getJson<TmdbCredits>(`${this.baseUrl}/tv/${id}/aggregate_credits?language=${language}`);
  }

  async getMovieDetails(id: number, language = 'vi-VN'): Promise<any> {
    return await this.getJson<any>(`${this.baseUrl}/movie/${id}?language=${language}`);
  }

  async getTVDetails(id: number, language = 'vi-VN'): Promise<any> {
    return await this.getJson<any>(`${this.baseUrl}/tv/${id}?language=${language}`);
  }
}

