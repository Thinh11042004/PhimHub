# KKPhim API Integration

This integration allows you to import movies from the KKPhim API (kkphim.com/tai-lieu-api) into your PhimHub database.

## Features

- 🔍 **Search Movies**: Search for movies in the KKPhim API
- 📥 **Single Import**: Import individual movies with full details and episodes
- 📦 **Bulk Import**: Import multiple pages of latest movies at once
- 🔄 **Multiple API Versions**: Support for v1, v2, and v3 endpoints
- 🎭 **Auto-Creation**: Automatically create actors, directors, and genres
- 📺 **Episode Support**: Import episodes and streaming links for series

## API Endpoints

### Search Movies
```http
GET /api/movies/search-kkphim?query={search_term}&page={page_number}
```

**Example:**
```bash
curl "http://localhost:3001/api/movies/search-kkphim?query=avenger&page=1"
```

### Import Single Movie
```http
POST /api/movies/import-from-kkphim
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "slug": "movie-slug-from-kkphim",
  "options": {
    "auto_create_actors": true,
    "auto_create_genres": true,
    "auto_create_directors": true,
    "import_episodes": true
  }
}
```

### Bulk Import Latest Movies
```http
POST /api/movies/bulk-import-from-kkphim
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "pages": 2,
  "version": "v1",
  "start_page": 1,
  "options": {
    "auto_create_actors": true,
    "auto_create_genres": true,
    "auto_create_directors": true,
    "import_episodes": false
  }
}
```

## Using the Test Script

A test script is provided to help you get started with the API integration.

### Setup

1. Make sure your backend server is running:
```powershell
cd d:\PhimHub\backend
npm run dev
```

2. Set your authentication token (get this from your login):
```powershell
$env:AUTH_TOKEN="your_jwt_token_here"
```

3. Run the test script:
```powershell
cd d:\PhimHub\backend
node scripts/test-kkphim-api.js
```

### Test Script Functions

The test script includes several utility functions:

```javascript
// Search for movies
const results = await searchMovies('batman', 1);

// Import a single movie
const movie = await importMovie('batman-2022');

// Bulk import latest movies
const results = await bulkImportLatestMovies(2, 'v1');
```

## API Versions

KKPhim API provides multiple endpoints for retrieving movies:

- **v1**: `/danh-sach/phim-moi-cap-nhat?page={page}`
- **v2**: `/danh-sach/phim-moi-cap-nhat-v2?page={page}`
- **v3**: `/danh-sach/phim-moi-cap-nhat-v3?page={page}`

Each version may return different sets of movies or different data structures.

## Import Options

### auto_create_actors
- `true`: Automatically create new actor records if they don't exist
- `false`: Skip actor creation, only link existing actors

### auto_create_genres
- `true`: Automatically create new genre records if they don't exist
- `false`: Skip genre creation, only link existing genres

### auto_create_directors
- `true`: Automatically create new director records if they don't exist
- `false`: Skip director creation, only link existing directors

### import_episodes
- `true`: Import episode data and streaming links
- `false`: Only import movie metadata (recommended for bulk imports)

## Data Mapping

The integration maps KKPhim API data to your database schema:

| KKPhim Field | Database Field | Notes |
|--------------|----------------|--------|
| `name` | `title` | Movie title |
| `origin_name` | `original_title` | Original title |
| `slug` | `slug` | URL slug |
| `content` | `description` | Movie description |
| `year` | `release_year` | Release year |
| `poster_url` | `poster_url` | Poster image |
| `thumb_url` | `thumbnail_url` | Thumbnail image |
| `quality` | `quality` | Video quality |
| `lang` | `language` | Audio language |
| `actor` | `actors` | Actor names array |
| `director` | `directors` | Director names array |
| `category` | `genres` | Genre objects |
| `country` | `countries` | Country objects |

## Error Handling

The integration includes comprehensive error handling:

- **Network Errors**: Handles API timeouts and connection issues
- **Data Validation**: Validates required fields before import
- **Duplicate Detection**: Skips movies that already exist in database
- **Transaction Safety**: Uses database transactions to ensure data integrity

## Rate Limiting

To avoid overloading the KKPhim API:

- 1-second delay between page requests in bulk import
- Proper User-Agent headers to identify requests
- Timeout settings to prevent hanging requests

## Monitoring

Import results include detailed statistics:

```json
{
  "imported": 15,
  "skipped": 3,
  "errors": 1,
  "details": [
    {
      "slug": "movie-slug",
      "title": "Movie Title",
      "status": "imported|skipped|error",
      "id": "database_id",
      "reason": "error_reason_if_applicable"
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Authentication Error**: Make sure you have a valid JWT token
2. **Movie Not Found**: The slug may not exist in KKPhim API
3. **Network Timeout**: KKPhim API may be slow, try again later
4. **Database Error**: Check database connection and schema

### Debug Mode

Enable debug logging by setting:
```powershell
$env:DEBUG="kkphim-api"
```

This will log detailed information about API requests and responses.

## Example Usage

Here's a complete example of how to use the integration:

```javascript
// 1. Search for a movie
const searchResults = await fetch('http://localhost:3001/api/movies/search-kkphim?query=spider-man');
const movies = await searchResults.json();

// 2. Pick a movie to import
const movieSlug = movies.data.items[0].slug;

// 3. Import the movie
const importResponse = await fetch('http://localhost:3001/api/movies/import-from-kkphim', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourToken}`
  },
  body: JSON.stringify({
    slug: movieSlug,
    options: {
      auto_create_actors: true,
      auto_create_genres: true,
      auto_create_directors: true,
      import_episodes: true
    }
  })
});

const result = await importResponse.json();
console.log('Imported movie:', result.data);
```

## Best Practices

1. **Test First**: Always test with a single movie before bulk importing
2. **Monitor Resources**: Bulk imports can be resource-intensive
3. **Regular Backups**: Backup your database before large imports
4. **Validate Data**: Check imported data for accuracy
5. **Rate Limiting**: Don't overwhelm the external API

## Support

If you encounter issues with the KKPhim API integration, check:

1. Network connectivity to kkphim.com
2. Database connection and permissions  
3. Authentication token validity
4. Server logs for detailed error messages
