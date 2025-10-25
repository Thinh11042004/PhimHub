# KKPhim API Integration Test Script
# PowerShell version for Windows users

param(
    [string]$Action = "help",
    [string]$Query = "",
    [string]$Slug = "",
    [int]$Pages = 2,
    [string]$Version = "v1",
    [string]$Token = $env:AUTH_TOKEN,
    [string]$BaseUrl = "http://localhost:3001/api"
)

# Colors for output
$ColorSuccess = "Green"
$ColorError = "Red"  
$ColorWarning = "Yellow"
$ColorInfo = "Cyan"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Invoke-ApiRequest {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Body = $null
    )
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri = "$BaseUrl$Endpoint"
            Method = $Method
            Headers = $headers
        }
        
        if ($Body -and $Method -ne "GET") {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-ColorOutput "❌ API Error: $($_.Exception.Message)" $ColorError
        if ($_.Exception.Response) {
            $errorResponse = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorResponse)
            $errorContent = $reader.ReadToEnd()
            Write-ColorOutput "Response: $errorContent" $ColorError
        }
        throw
    }
}

function Search-Movies {
    param([string]$SearchQuery, [int]$Page = 1)
    
    Write-ColorOutput "🔍 Searching KKPhim API for: '$SearchQuery'" $ColorInfo
    
    try {
        $response = Invoke-ApiRequest "/movies/search-kkphim?query=$([uri]::EscapeDataString($SearchQuery))&page=$Page"
        
        Write-ColorOutput "✅ Found $($response.data.items.Count) movies" $ColorSuccess
        Write-ColorOutput "📋 Search Results:" $ColorInfo
        
        $response.data.items | ForEach-Object -Begin { $i = 1 } -Process {
            Write-ColorOutput "   $i. $($_.title) ($($_.year)) - $($_.slug)" "White"
            Write-ColorOutput "      Type: $($_.type) | Quality: $($_.quality) | Episodes: $($_.episode_current)/$($_.episode_total)" "Gray"
            $i++
        }
        
        return $response.data
    }
    catch {
        Write-ColorOutput "❌ Search failed" $ColorError
        return $null
    }
}

function Import-Movie {
    param(
        [string]$MovieSlug,
        [hashtable]$Options = @{
            auto_create_actors = $true
            auto_create_genres = $true
            auto_create_directors = $true
            import_episodes = $true
        }
    )
    
    Write-ColorOutput "📥 Importing movie from KKPhim API: $MovieSlug" $ColorInfo
    
    if (-not $Token) {
        Write-ColorOutput "❌ Authentication token required for import operations" $ColorError
        Write-ColorOutput "Set token with: `$env:AUTH_TOKEN='your_token_here'" $ColorWarning
        return $null
    }
    
    try {
        $body = @{
            slug = $MovieSlug
            options = $Options
        }
        
        $response = Invoke-ApiRequest "/movies/import-from-kkphim" "POST" $body
        
        Write-ColorOutput "✅ Movie imported successfully!" $ColorSuccess
        Write-ColorOutput "   Movie ID: $($response.data.id)" "White"
        Write-ColorOutput "   Title: $($response.data.title)" "White"
        
        return $response.data
    }
    catch {
        Write-ColorOutput "❌ Import failed" $ColorError
        return $null
    }
}

function Import-BulkMovies {
    param(
        [int]$PageCount = 2,
        [string]$ApiVersion = "v1",
        [hashtable]$Options = @{
            auto_create_actors = $true
            auto_create_genres = $true  
            auto_create_directors = $true
            import_episodes = $false
        }
    )
    
    Write-ColorOutput "📦 Bulk importing latest movies ($PageCount pages, version: $ApiVersion)" $ColorInfo
    
    if (-not $Token) {
        Write-ColorOutput "❌ Authentication token required for import operations" $ColorError
        Write-ColorOutput "Set token with: `$env:AUTH_TOKEN='your_token_here'" $ColorWarning
        return $null
    }
    
    try {
        $body = @{
            pages = $PageCount
            version = $ApiVersion
            start_page = 1
            options = $Options
        }
        
        $response = Invoke-ApiRequest "/movies/bulk-import-from-kkphim" "POST" $body
        
        Write-ColorOutput "✅ Bulk import completed!" $ColorSuccess
        Write-ColorOutput "   📊 Results: $($response.data.imported) imported, $($response.data.skipped) skipped, $($response.data.errors) errors" "White"
        
        $importedMovies = $response.data.details | Where-Object { $_.status -eq "imported" }
        if ($importedMovies.Count -gt 0) {
            Write-ColorOutput "`n🎬 Recently imported movies:" $ColorInfo
            $importedMovies | Select-Object -First 5 | ForEach-Object -Begin { $i = 1 } -Process {
                Write-ColorOutput "   $i. $($_.title) ($($_.slug))" "White"
                $i++
            }
            
            if ($importedMovies.Count -gt 5) {
                Write-ColorOutput "   ... and $($importedMovies.Count - 5) more movies" "Gray"
            }
        }
        
        return $response.data
    }
    catch {
        Write-ColorOutput "❌ Bulk import failed" $ColorError
        return $null
    }
}

function Show-Help {
    Write-ColorOutput "🚀 KKPhim API Integration PowerShell Script" $ColorInfo
    Write-ColorOutput ""
    Write-ColorOutput "USAGE:" "White"
    Write-ColorOutput "  .\test-kkphim-api.ps1 -Action <action> [options]" "Gray"
    Write-ColorOutput ""
    Write-ColorOutput "ACTIONS:" "White"
    Write-ColorOutput "  search          Search for movies" "Gray"
    Write-ColorOutput "  import          Import a single movie" "Gray"
    Write-ColorOutput "  bulk-import     Bulk import latest movies" "Gray"
    Write-ColorOutput "  help            Show this help message" "Gray"
    Write-ColorOutput ""
    Write-ColorOutput "EXAMPLES:" "White"
    Write-ColorOutput "  # Search for movies" "Gray"
    Write-ColorOutput "  .\test-kkphim-api.ps1 -Action search -Query 'spider man'" "Gray"
    Write-ColorOutput ""
    Write-ColorOutput "  # Import a specific movie" "Gray"
    Write-ColorOutput "  .\test-kkphim-api.ps1 -Action import -Slug 'spider-man-2021'" "Gray"
    Write-ColorOutput ""
    Write-ColorOutput "  # Bulk import 3 pages from v2 API" "Gray"
    Write-ColorOutput "  .\test-kkphim-api.ps1 -Action bulk-import -Pages 3 -Version v2" "Gray"
    Write-ColorOutput ""
    Write-ColorOutput "AUTHENTICATION:" "White"
    Write-ColorOutput "  Set your token: `$env:AUTH_TOKEN='your_jwt_token_here'" "Gray"
    Write-ColorOutput ""
    Write-ColorOutput "OPTIONS:" "White"
    Write-ColorOutput "  -Query          Search query (for search action)" "Gray"
    Write-ColorOutput "  -Slug           Movie slug (for import action)" "Gray"
    Write-ColorOutput "  -Pages          Number of pages to import (default: 2)" "Gray"
    Write-ColorOutput "  -Version        API version: v1, v2, or v3 (default: v1)" "Gray"
    Write-ColorOutput "  -Token          Authentication token (default: `$env:AUTH_TOKEN)" "Gray"
    Write-ColorOutput "  -BaseUrl        API base URL (default: http://localhost:3001/api)" "Gray"
}

# Main execution
switch ($Action.ToLower()) {
    "search" {
        if (-not $Query) {
            Write-ColorOutput "❌ Query parameter is required for search action" $ColorError
            Write-ColorOutput "Example: .\test-kkphim-api.ps1 -Action search -Query 'batman'" $ColorWarning
            exit 1
        }
        Search-Movies $Query
    }
    
    "import" {
        if (-not $Slug) {
            Write-ColorOutput "❌ Slug parameter is required for import action" $ColorError
            Write-ColorOutput "Example: .\test-kkphim-api.ps1 -Action import -Slug 'batman-2022'" $ColorWarning
            exit 1
        }
        Import-Movie $Slug
    }
    
    "bulk-import" {
        Import-BulkMovies $Pages $Version
    }
    
    "help" {
        Show-Help
    }
    
    default {
        Write-ColorOutput "❌ Unknown action: $Action" $ColorError
        Write-ColorOutput "Use -Action help to see available actions" $ColorWarning
        exit 1
    }
}
