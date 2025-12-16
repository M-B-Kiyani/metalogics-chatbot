# Rate Limiting Test Script for Windows
# Tests the rate limiting configuration

param(
    [string]$Url = "http://localhost:3000/api/health",
    [int]$Requests = 55,
    [switch]$Verbose
)

Write-Host "=========================================="
Write-Host "Rate Limiting Test"
Write-Host "=========================================="
Write-Host "Target: $Url"
Write-Host "Requests: $Requests"
Write-Host ""

$successCount = 0
$rateLimitedCount = 0
$errorCount = 0
$limit = $null
$remaining = $null

for ($i = 1; $i -le $Requests; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
        
        # Extract rate limit headers
        $limit = $response.Headers["X-RateLimit-Limit"]
        $remaining = $response.Headers["X-RateLimit-Remaining"]
        $reset = $response.Headers["X-RateLimit-Reset"]
        
        if ($response.StatusCode -eq 200) {
            $successCount++
            if ($Verbose) {
                Write-Host "Request $i : SUCCESS (Remaining: $remaining/$limit)" -ForegroundColor Green
            } else {
                Write-Host "." -NoNewline -ForegroundColor Green
            }
        }
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            $rateLimitedCount++
            $retryAfter = $_.Exception.Response.Headers["Retry-After"]
            if ($Verbose) {
                Write-Host "Request $i : RATE LIMITED (Retry after: $retryAfter seconds)" -ForegroundColor Yellow
            } else {
                Write-Host "X" -NoNewline -ForegroundColor Yellow
            }
        }
        else {
            $errorCount++
            if ($Verbose) {
                Write-Host "Request $i : ERROR ($($_.Exception.Message))" -ForegroundColor Red
            } else {
                Write-Host "!" -NoNewline -ForegroundColor Red
            }
        }
    }
    
    # Small delay to avoid overwhelming the server
    Start-Sleep -Milliseconds 50
}

Write-Host ""
Write-Host ""
Write-Host "=========================================="
Write-Host "Test Results"
Write-Host "=========================================="
Write-Host "Total Requests:    $Requests"
Write-Host "Successful:        $successCount" -ForegroundColor Green
Write-Host "Rate Limited:      $rateLimitedCount" -ForegroundColor Yellow
Write-Host "Errors:            $errorCount" -ForegroundColor Red
Write-Host ""
Write-Host "Rate Limit Config:"
Write-Host "  Limit:           $limit requests/minute"
Write-Host "  Last Remaining:  $remaining"
Write-Host ""

if ($rateLimitedCount -gt 0) {
    Write-Host "✅ Rate limiting is WORKING correctly!" -ForegroundColor Green
    Write-Host "   Requests were blocked after reaching the limit." -ForegroundColor Green
} elseif ($successCount -eq $Requests) {
    Write-Host "⚠️  Rate limiting may NOT be working!" -ForegroundColor Yellow
    Write-Host "   All requests succeeded. Expected some to be rate limited." -ForegroundColor Yellow
} else {
    Write-Host "❌ Test inconclusive due to errors." -ForegroundColor Red
}

Write-Host ""
Write-Host "Legend:"
Write-Host "  . = Success (200 OK)" -ForegroundColor Green
Write-Host "  X = Rate Limited (429)" -ForegroundColor Yellow
Write-Host "  ! = Error" -ForegroundColor Red
Write-Host ""
