// Standardized movie model for the app

export type Subtitle = {
  label: string;
  lang: string;
  src: string;
  default?: boolean;
};

export type MovieVersion = {
  key: string; // e.g., 'sub', 'dub'
  label: string; // display label
  note?: string; // quality/note
};

export type Episode = {
  name: string;
  slug: string;
  filename: string;
  link_m3u8?: string;
  link_embed?: string;
  file?: string;
  quality?: string;
};

export type EpisodeServer = {
  server_name: string;
  server_slug: string;
  server_data: Episode[];
};

export type Movie = MovieDetail;

export type MovieDetail = {
  id: string;
  title: string;
  originalTitle?: string;
  isSeries?: boolean;
  year?: number;
  duration?: number; // minutes
  ageRating?: string;
  rating?: number; // IMDb or provider rating
  poster?: string;
  banner?: string;
  overview?: string;
  genres?: string[];
  // Additional detailed information
  director?: string;
  cast?: string[];
  country?: string;
  studio?: string;
  trailer?: string;
  // Technical details
  versions: MovieVersion[];
  subtitles?: Subtitle[];
  // initial stream
  stream: {
    hls?: string;
    mp4?: string;
  };
  // Episodes for series
  episodes?: EpisodeServer[];
  recommendations?: Array<{ id: string | number; title: string; img: string }>;
};

export interface MovieProvider {
  getMovieById(id: string): Promise<MovieDetail>;
  switchVersion?(id: string, versionKey: string): Promise<{ hls?: string; mp4?: string; subtitles?: Subtitle[] }>;
  updateMovie?(movieId: string, updateData: any): Promise<MovieDetail>;
}


