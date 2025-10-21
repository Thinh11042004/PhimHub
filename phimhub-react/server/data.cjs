const genres = [
  { id: 'g_action', name: 'Hành động' },
  { id: 'g_scifi', name: 'Khoa học' },
  { id: 'g_sf', name: 'Viễn tưởng' },
]

const movies = Array.from({ length: 15 }).map((_, i) => ({
  id: `m_${i + 1}`,
  title: `Tựa phim ${i + 1}`,
  type: 'movie',
  year: 2020 + (i % 5),
  age: ['P', 'K', 'T13', 'T16', 'T18'][i % 5],
  genres: ['Hành động', 'Khoa học'].slice(0, (i % 2) + 1),
  countries: ['US'],
  durationMin: 90 + (i % 60),
  rating: 7 + (i % 30) / 10,
  views: 1000 * (i + 1),
  poster: `/doan/assets/img/phimlemoi${(i % 4) + 1}.jpg`,
  backdrop: `/doan/assets/img/dienanhmoi${(i % 4) + 1}.jpg`,
  desc: 'Mô tả ngắn.',
}))

const series = Array.from({ length: 8 }).map((_, i) => ({
  id: `s_${i + 1}`,
  title: `Series ${i + 1}`,
  type: 'series',
  year: 2020 + (i % 5),
  age: ['P', 'K', 'T13', 'T16', 'T18'][i % 5],
  genres: ['Khoa học', 'Viễn tưởng'].slice(0, (i % 2) + 1),
  countries: ['US'],
  rating: 8 + (i % 10) / 10,
  views: 500 * (i + 1),
  poster: `/doan/assets/img/phimbomoi${(i % 4) + 1}.jpg`,
  backdrop: `/doan/assets/img/banner${(i % 2) + 1}.jpg`,
  desc: 'Series demo.',
  seasons: [
    { season: 1, episodes: 6 },
  ],
}))

const comments = {}

module.exports = { genres, movies, series, comments }


