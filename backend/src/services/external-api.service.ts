import axios from 'axios';

// Types for PhimAPI response
export interface PhimAPIMovie {
  tmdb: {
    type: string;
    id: string;
    season: number;
    vote_average: number;
    vote_count: number;
  };
  imdb: {
    id: string | null;
  };
  created: {
    time: string;
  };
  modified: {
    time: string;
  };
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
}

export interface PhimAPIEpisode {
  name: string;
  slug: string;
  filename: string;
  link_embed: string;
  link_m3u8: string;
}

export interface PhimAPIEpisodeServer {
  server_name: string;
  server_data: PhimAPIEpisode[];
}

export interface PhimAPIResponse {
  status: boolean;
  msg: string;
  movie: PhimAPIMovie;
  episodes: PhimAPIEpisodeServer[];
}

export class ExternalAPIService {
  private readonly baseURL = 'https://phimapi.com';

  /**
   * Fetch movie data from PhimAPI by slug
   */
  async getMovieBySlug(slug: string): Promise<PhimAPIResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/phim/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching movie from PhimAPI:', error);
      throw new Error(`Failed to fetch movie: ${slug}`);
    }
  }

  /**
   * Transform PhimAPI data to our database format
   */
  transformPhimAPIToMovie(phimData: PhimAPIResponse) {
    const { movie, episodes } = phimData;
    
    // Extract episode count from episode_total string
    const episodeCount = parseInt(movie.episode_total.replace(/\D/g, '')) || 0;
    
    // Transform genres from category
    const genres = movie.category.map(cat => ({
      name: cat.name,
      slug: cat.slug
    }));

    // Transform countries
    const countries = movie.country.map(country => ({
      name: country.name,
      slug: country.slug
    }));

    // Transform episodes
    const transformedEpisodes = episodes.flatMap(server => 
      server.server_data.map((episode, index) => ({
        episode_number: index + 1,
        title: episode.name,
        slug: episode.slug,
        filename: episode.filename,
        episode_url: episode.link_m3u8,
        embed_url: episode.link_embed,
        server_name: server.server_name
      }))
    );

    return {
      // Basic movie info
      slug: movie.slug,
      title: movie.name,
      original_title: movie.origin_name,
      description: movie.content,
      release_year: movie.year,
      duration: this.parseDuration(movie.time),
      age_rating: this.mapAgeRating(movie.type),
      thumbnail_url: movie.poster_url,
      banner_url: movie.thumb_url,
      trailer_url: movie.trailer_url,
      is_series: movie.episode_total !== '1' || episodeCount > 1,
      status: this.mapStatus(movie.status),
      country: movie.country && movie.country.length > 0 ? movie.country[0].name : null, // Primary country
      
      // External metadata
      external_id: movie._id,
      tmdb_id: movie.tmdb?.id,
      imdb_id: movie.imdb?.id,
      external_rating: movie.tmdb?.vote_average,
      external_rating_count: movie.tmdb?.vote_count,
      external_view_count: movie.view,
      quality: movie.quality,
      language: movie.lang,
      
      // Relationships
      actors: movie.actor,
      directors: movie.director,
      genres,
      countries,
      episodes: transformedEpisodes,
      total_episodes: episodeCount
    };
  }

  /**
   * Parse duration string to minutes
   */
  private parseDuration(timeStr: string): number | null {
    if (!timeStr) return null;
    
    const match = timeStr.match(/(\d+)\s*phút/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Map PhimAPI type to age rating
   */
  private mapAgeRating(type: string): string {
    const ratingMap: { [key: string]: string } = {
      'hoathinh': 'G',
      'phimle': 'PG-13',
      'phimbo': 'PG-13',
      'tamly': 'R',
      'kinhdi': 'R'
    };
    
    return ratingMap[type] || 'PG-13';
  }

  /**
   * Map PhimAPI status to our status
   */
  private mapStatus(status: string): 'published' | 'draft' | 'archived' {
    const statusMap: { [key: string]: 'published' | 'draft' | 'archived' } = {
      'ongoing': 'published',
      'completed': 'published',
      'upcoming': 'draft',
      'cancelled': 'archived'
    };
    
    return statusMap[status] || 'published';
  }

  /**
   * Check if movie exists in external API
   */
  async checkMovieExists(slug: string): Promise<boolean> {
    try {
      await this.getMovieBySlug(slug);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Search movies by query (if PhimAPI supports it)
   */
  async searchMovies(query: string, page: number = 1): Promise<any> {
    try {
      // Note: This would depend on PhimAPI's search endpoint
      // For now, we'll implement a basic search
      const response = await axios.get(`${this.baseURL}/tim-kiem`, {
        params: { q: query, page }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw new Error('Failed to search movies');
    }
  }
}
