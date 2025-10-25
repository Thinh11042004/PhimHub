# Quick Start: KKPhim API Integration

## 🚀 Setup Guide

Follow these steps to start importing movies from KKPhim API into your PhimHub database.

### Step 1: Start Your Backend Server

```powershell
cd d:\PhimHub\backend
npm install  # If not already done
npm run dev
```

Wait for the message: `✅ Server running on port 3001`

### Step 2: Get Authentication Token

1. Open your browser and go to `http://localhost:3000`
2. Login to your PhimHub admin account
3. Open browser Developer Tools (F12)
4. Go to Application/Storage → Local Storage
5. Copy the value of `phimhub:token`

### Step 3: Set Authentication Token

```powershell
# Replace 'your_actual_token_here' with the token you copied
$env:AUTH_TOKEN="your_actual_token_here"
```

### Step 4: Test the Integration

#### Option A: Using PowerShell Script (Recommended)

```powershell
cd d:\PhimHub\backend\scripts

# Search for movies
.\test-kkphim-api.ps1 -Action search -Query "spider man"

# Import a specific movie (use slug from search results)  
.\test-kkphim-api.ps1 -Action import -Slug "spider-man-no-way-home"

# Bulk import latest movies
.\test-kkphim-api.ps1 -Action bulk-import -Pages 2 -Version v1
```

#### Option B: Using Node.js Script

```powershell
cd d:\PhimHub\backend
node scripts/test-kkphim-api.js
```

#### Option C: Direct API Calls

Search for movies:
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/movies/search-kkphim?query=batman" -Method GET
$response.data.items | Select-Object title, slug, year
```

Import a movie:
```powershell
$headers = @{ 
    "Authorization" = "Bearer $env:AUTH_TOKEN"
    "Content-Type" = "application/json" 
}
$body = @{
    slug = "batman-2022"
    options = @{
        auto_create_actors = $true
        auto_create_genres = $true
        auto_create_directors = $true
        import_episodes = $true
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/movies/import-from-kkphim" -Method POST -Headers $headers -Body $body
```

### Step 5: Verify Import

Check your PhimHub frontend at `http://localhost:3000` to see the imported movies.

## 📋 Available Commands

### Search Movies
```powershell
.\test-kkphim-api.ps1 -Action search -Query "your search term"
```

### Import Single Movie
```powershell
.\test-kkphim-api.ps1 -Action import -Slug "movie-slug-here"
```

### Bulk Import Latest Movies
```powershell
# Import 2 pages from v1 API
.\test-kkphim-api.ps1 -Action bulk-import -Pages 2 -Version v1

# Import 5 pages from v2 API  
.\test-kkphim-api.ps1 -Action bulk-import -Pages 5 -Version v2
```

## ⚙️ Configuration Options

### Import Options

When importing movies, you can customize the behavior:

```powershell
# Full import with all options enabled
.\test-kkphim-api.ps1 -Action import -Slug "movie-slug" 

# The script uses these default options:
# - auto_create_actors: true (create new actors automatically)
# - auto_create_genres: true (create new genres automatically)  
# - auto_create_directors: true (create new directors automatically)
# - import_episodes: true (import episode data for series)
```

### API Versions

KKPhim provides different API endpoints:

- **v1**: Standard latest movies endpoint
- **v2**: Alternative endpoint with potentially different movies
- **v3**: Another variant with different data

Try different versions to get various sets of movies:
```powershell
.\test-kkphim-api.ps1 -Action bulk-import -Version v1
.\test-kkphim-api.ps1 -Action bulk-import -Version v2  
.\test-kkphim-api.ps1 -Action bulk-import -Version v3
```

## 🔍 Troubleshooting

### Common Issues

**"Authentication token required"**
- Make sure you set `$env:AUTH_TOKEN` with a valid JWT token
- Token expires after some time, get a new one from browser storage

**"Cannot find module 'express'"** 
- This is normal when viewing code files, the server needs to be running

**"Movie not found in KKPhim API"**
- The movie slug might be incorrect or the movie doesn't exist
- Try searching first to get valid slugs

**"Network timeout"**
- KKPhim API might be slow, try again later
- Check your internet connection

### Debug Mode

Enable detailed logging:
```powershell
$env:DEBUG="kkphim-api"
.\test-kkphim-api.ps1 -Action search -Query "test"
```

### Check Server Logs

Monitor your backend server console for detailed error messages and import progress.

## 📊 Understanding Results

### Search Results
```
✅ Found 5 movies
📋 Search Results:
   1. Spider-Man: No Way Home (2021) - spider-man-no-way-home
      Type: movie | Quality: HD | Episodes: Full/Full
   2. Spider-Man: Into the Spider-Verse (2018) - spider-man-into-spider-verse
      Type: movie | Quality: HD | Episodes: Full/Full
```

### Import Results
```
✅ Movie imported successfully!
   Movie ID: 123
   Title: Spider-Man: No Way Home
```

### Bulk Import Results  
```
✅ Bulk import completed!
   📊 Results: 15 imported, 3 skipped, 1 errors

🎬 Recently imported movies:
   1. The Batman (the-batman-2022)
   2. Doctor Strange 2 (doctor-strange-2)
   3. Thor: Love and Thunder (thor-love-thunder)
```

## 🎯 Best Practices

1. **Start Small**: Test with 1-2 movies before bulk importing
2. **Check Results**: Verify imported movies in your frontend
3. **Monitor Resources**: Bulk imports use CPU and database resources
4. **Regular Backups**: Backup your database before large imports
5. **Rate Limiting**: Don't run multiple bulk imports simultaneously

## 🆘 Getting Help

If you need assistance:

1. Check the server console for error messages
2. Review the detailed documentation in `KKPHIM_API_INTEGRATION.md`
3. Test with individual movies first before bulk importing
4. Ensure your database has enough space for new movies

## 🎉 Success!

Once everything is working, you'll have access to thousands of movies from KKPhim API that you can import into your PhimHub database with just a few commands!

# Quick Start: KKPhim Crawler

Validate the hourly crawler and manual triggers.

1) Configure env

Add to .env (already added by agent):

- KKPHIM_CRAWLER_ENABLED=true
- KKPHIM_CRAWLER_CRON=0 * * * *
- KKPHIM_CRAWLER_PAGES=2
- KKPHIM_CRAWLER_START_PAGE=1
- KKPHIM_CRAWLER_VERSION=v1
- KKPHIM_CRAWLER_DELAY_MS=800

2) Rebuild and run

PowerShell:

- cd d:\PhimHub
- docker compose up -d --build backend

3) Trigger a crawl once (admin only)

- Acquire a JWT via login
- $Headers = @{ 'Authorization' = 'Bearer {TOKEN}'; 'Content-Type'='application/json' }
- Invoke-RestMethod -Uri 'http://localhost:3001/jobs/kkphim/run-once' -Method POST -Headers $Headers -Body '{}' | ConvertTo-Json -Depth 6

4) Inspect last run

- Invoke-RestMethod -Uri 'http://localhost:3001/jobs/kkphim/last' -Method GET -Headers $Headers | ConvertTo-Json -Depth 6

5) Manual repair of episodes for an existing movie

- Invoke-RestMethod -Uri 'http://localhost:3001/api/movies/{id}/sync-from-kkphim' -Method PUT -Headers $Headers -Body (@{ slug = 'movie-slug' } | ConvertTo-Json)

Notes

- getBySlug now imports from KKPhim on miss and includes episodes.
- Episodes are deduplicated across servers by episode_number with m3u8 preference.
- /jobs endpoints are protected by admin.
