// Database entity interfaces matching SQL Server schema

export interface Role {
  id: number;
  code: string;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  fullname?: string;
  avatar?: string;
  phone?: string;
  role_id?: number;
  last_login?: Date;
  created_at: Date;
  updated_at?: Date;
  status: 'active' | 'inactive' | 'banned';
}

export interface Movie {
  id: number;
  slug: string;
  title: string;
  description?: string;
  release_year?: number;
  duration?: number;
  age_rating?: string;
  thumbnail_url?: string;
  poster_url?: string; // Add missing poster_url field
  trailer_url?: string;
  is_series: boolean;
  view_count: number;
  created_at: Date;
  updated_at?: Date;
  status: 'published' | 'draft' | 'archived';
  categories?: string; // JSON string containing array of genre slugs
  country?: string; // Primary country of origin
  // External API fields
  external_id?: string;
  tmdb_id?: string;
  imdb_id?: string;
  original_title?: string;
  banner_url?: string;
  external_rating?: number;
  external_rating_count?: number;
  external_view_count?: number;
  quality?: string;
  language?: string;
}

export interface Season {
  id: number;
  movie_id: number;
  season_number: number;
  title?: string;
  created_at: Date;
}

export interface Episode {
  id: number;
  movie_id: number;
  season_id?: number;
  episode_number: number;
  title?: string;
  duration?: number;
  episode_url?: string;
  created_at: Date;
}

export interface Content {
  id: number;
  content_type: 'movie' | 'episode';
  movie_id?: number;
  episode_id?: number;
  created_at: Date;
}

export interface Actor {
  id: number;
  name: string;
  dob?: Date;
  nationality?: string;
  photo_url?: string;
}

export interface Director {
  id: number;
  name: string;
  dob?: Date;
  nationality?: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  movie_count: number;
}

export interface MovieActor {
  movie_id: number;
  actor_id: number;
  role_name?: string;
}

export interface MovieDirector {
  movie_id: number;
  director_id: number;
}

export interface MovieGenre {
  movie_id: number;
  genre_id: number;
}

export interface Favorite {
  user_id: number;
  content_id: number;
  added_at: Date;
}

export interface Rating {
  id: number;
  user_id: number;
  content_id: number;
  rating_value: number;
  created_at: Date;
}

export interface Comment {
  id: number;
  user_id: number;
  content_id: number;
  parent_id?: number;
  content: string;
  created_at: Date;
}

export interface Report {
  id: number;
  user_id: number;
  content_id?: number;
  comment_id?: number;
  reason?: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  created_at: Date;
}

export interface Subtitle {
  id: number;
  content_id: number;
  language: string;
  subtitle_url: string;
  created_at: Date;
}

export interface WatchHistory {
  id: number;
  user_id: number;
  content_id: number;
  last_watched_at: Date;
  progress?: number;
  device?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'new_episode' | 'system_message' | 'promotion' | 'comment_reply' | 'other';
  title?: string;
  content?: string;
  content_id?: number;
  is_read: boolean;
  created_at: Date;
}

// Extended interfaces with relationships
export interface UserWithRole extends User {
  role?: Role;
  role_code?: string;
  role_name?: string;
}

export interface MovieWithDetails extends Movie {
  actors?: Actor[];
  directors?: Director[];
  genres?: Genre[];
  seasons?: Season[];
  episodes?: Episode[];
  total_episodes?: number;
}

export interface EpisodeWithDetails extends Episode {
  movie?: Movie;
  season?: Season;
}

export interface CommentWithUser extends Comment {
  user?: User;
  replies?: CommentWithUser[];
}

export interface WatchHistoryWithContent extends WatchHistory {
  content?: Content;
  movie?: Movie;
  episode?: Episode;
}

// Request/Response DTOs
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullname?: string;
  avatar?: string;
  phone?: string;
  role_id?: number;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullname?: string;
  avatar?: string;
  phone?: string;
  role_id?: number;
  status?: 'active' | 'inactive' | 'banned';
}

export interface CreateMovieRequest {
  slug?: string;
  title: string;
  description?: string;
  release_year?: number;
  duration?: number;
  age_rating?: string;
  thumbnail_url?: string;
  poster_url?: string; // Add missing poster_url field
  trailer_url?: string;
  is_series?: boolean;
  status?: 'published' | 'draft' | 'archived';
  country?: string; // Primary country of origin
  actor_ids?: number[];
  director_ids?: number[];
  genre_ids?: number[];
  // External API fields
  external_id?: string;
  tmdb_id?: string;
  imdb_id?: string;
  original_title?: string;
  banner_url?: string;
  external_rating?: number;
  external_rating_count?: number;
  external_view_count?: number;
  quality?: string;
  language?: string;
}

export interface UpdateMovieRequest {
  slug?: string;
  title?: string;
  description?: string;
  release_year?: number;
  duration?: number;
  age_rating?: string;
  thumbnail_url?: string;
  poster_url?: string; // Add missing poster_url field
  trailer_url?: string;
  is_series?: boolean;
  status?: 'published' | 'draft' | 'archived';
  country?: string; // Primary country of origin
  actor_ids?: number[];
  director_ids?: number[];
  genre_ids?: number[];
  // External API fields
  external_id?: string;
  tmdb_id?: string;
  imdb_id?: string;
  original_title?: string;
  banner_url?: string;
  external_rating?: number;
  external_rating_count?: number;
  external_view_count?: number;
  quality?: string;
  language?: string;
}

export interface CreateSeasonRequest {
  movie_id: number;
  season_number: number;
  title?: string;
}

export interface CreateEpisodeRequest {
  movie_id: number;
  season_id?: number;
  episode_number: number;
  title?: string;
  duration?: number;
  episode_url?: string;
}

export interface CreateRatingRequest {
  user_id: number;
  content_id: number;
  rating_value: number;
}

export interface CreateCommentRequest {
  user_id: number;
  content_id: number;
  parent_id?: number;
  content: string;
}

export interface CreateFavoriteRequest {
  user_id: number;
  content_id: number;
}

export interface CreateWatchHistoryRequest {
  user_id: number;
  content_id: number;
  progress?: number;
  device?: string;
}

// Actor interfaces
export interface CreateActorRequest {
  name: string;
  dob?: Date;
  nationality?: string;
  photo_url?: string;
}

// Genre interfaces
export interface CreateGenreRequest {
  name: string;
}

// Query interfaces
export interface MovieQuery {
  page?: number;
  limit?: number;
  search?: string;
  genre_ids?: number[];
  year?: number;
  status?: string;
  is_series?: boolean;
  sort_by?: 'title' | 'release_year' | 'created_at' | 'view_count';
  sort_order?: 'asc' | 'desc';
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role_id?: number;
  status?: string;
  sort_by?: 'username' | 'email' | 'created_at' | 'last_login';
  sort_order?: 'asc' | 'desc';
}

export interface CommentQuery {
  content_id: number;
  page?: number;
  limit?: number;
  parent_id?: number;
}

export interface WatchHistoryQuery {
  user_id: number;
  page?: number;
  limit?: number;
  sort_by?: 'last_watched_at' | 'progress';
  sort_order?: 'asc' | 'desc';
}
