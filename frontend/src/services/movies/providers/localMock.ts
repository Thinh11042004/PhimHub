import { MovieDetail, MovieProvider } from "../model";

const covers = Array.from({ length: 8 }, (_, i) => `https://picsum.photos/seed/reco-${i}/480/720`);

export class LocalMockProvider implements MovieProvider {
  async getMovieById(id: string): Promise<MovieDetail> {
    return {
      id,
      title: "Interstellar",
      originalTitle: "Interstellar",
      year: 2014,
      duration: 169,
      ageRating: "13+",
      rating: 8.7,
      poster: "https://image.tmdb.org/t/p/w500/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
      banner: "https://images.unsplash.com/photo-1447433819943-74a20887a81e?q=80&w=1800&auto=format&fit=crop",
      overview:
        "Một nhóm nhà thám hiểm du hành xuyên qua hố đen để tìm ngôi nhà mới cho nhân loại.",
      genres: ["Khoa học", "Phiêu lưu", "Drama"],
      // Additional detailed information
      director: "Christopher Nolan",
      cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
      country: "Mỹ",
      studio: "Paramount Pictures",
      trailer: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
      versions: [
        { key: "sub", label: "Phụ đề", note: "HLS 1080p" },
        { key: "dub", label: "Lồng tiếng", note: "HLS 720p" },
      ],
      subtitles: [
        { label: "Tiếng Việt", lang: "vi", src: "https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_vietnamese.vtt" },
        { label: "English", lang: "en", src: "https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_en.vtt", default: true },
      ],
      stream: {
        hls: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      },
      recommendations: covers.map((img, i) => ({ id: `${300 + i}`, title: `Gợi ý ${i + 1}`, img })),
    };
  }

  async switchVersion(id: string, versionKey: string) {
    // Mock: đổi link HLS tuỳ version
    if (versionKey === "dub") {
      return { hls: "https://test-streams.mux.dev/pts-vod/sample_960x540.m3u8" };
    }
    return { hls: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" };
  }
}


