export interface Director {
  id: number;
  name: string;
  dob?: string;
  nationality?: string;
  photo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DirectorMovie {
  id: number;
  title: string;
  slug: string;
  poster_url?: string;
  release_year?: number;
  is_series: boolean;
}
