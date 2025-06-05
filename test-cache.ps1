# Strapi Cache Performance Test
Write-Host "Testing Strapi Cache Performance..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:1337"
$endpoint = "/api/articles"
$url = "$baseUrl$endpoint"

# Function to measure response time
function Test-StrapiResponse {
    param($requestNumber)
    
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method GET -ErrorAction Stop
        $stopwatch.Stop()
        $responseTime = $stopwatch.ElapsedMilliseconds
        
        Write-Host "Request $requestNumber`: $responseTime ms - Status: 200 [SUCCESS]" -ForegroundColor Green
        
        return @{
            ResponseTime = $responseTime
            Success = $true
            Data = $response
        }
    }
    catch {
        $stopwatch.Stop()
        $responseTime = $stopwatch.ElapsedMilliseconds
        
        Write-Host "Request $requestNumber`: $responseTime ms - Error: $($_.Exception.Message) [ERROR]" -ForegroundColor Red
        
        return @{
            ResponseTime = $responseTime
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Test cache performance with multiple requests
Write-Host "Running 5 consecutive requests to test cache performance..." -ForegroundColor Yellow
Write-Host ""

$results = @()

for ($i = 1; $i -le 5; $i++) {
    $result = Test-StrapiResponse -requestNumber $i
    $results += $result
    
    if ($i -lt 5) {
        Start-Sleep -Milliseconds 200  # Small delay between requests
    }
}

# Analyze results
Write-Host ""
Write-Host "Cache Performance Analysis:" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$successfulRequests = $results | Where-Object { $_.Success -eq $true }

if ($successfulRequests.Count -gt 1) {
    $firstTime = $successfulRequests[0].ResponseTime
    $subsequentTimes = $successfulRequests[1..($successfulRequests.Count-1)]
    $avgSubsequent = ($subsequentTimes | Measure-Object -Property ResponseTime -Average).Average
    
    Write-Host "First request: $firstTime ms" -ForegroundColor White
    Write-Host "Subsequent requests average: $([math]::Round($avgSubsequent, 2)) ms" -ForegroundColor White
    
    if ($avgSubsequent -lt ($firstTime * 0.8)) {
        Write-Host "[SUCCESS] Cache appears to be working! Subsequent requests are faster." -ForegroundColor Green
    } elseif ($avgSubsequent -lt ($firstTime * 0.95)) {
        Write-Host "[WARNING] Cache might be working, but improvement is minimal." -ForegroundColor Yellow
    } else {
        Write-Host "[WARNING] Cache might not be working optimally. Response times are similar." -ForegroundColor Red
    }
} else {
    Write-Host "[ERROR] Not enough successful requests to analyze cache performance" -ForegroundColor Red
}

Write-Host ""
Write-Host "Tips to verify cache is working:" -ForegroundColor Yellow
Write-Host "1. Check your Strapi console for cache debug messages" -ForegroundColor Gray
Write-Host "2. Look for cache-related headers in response" -ForegroundColor Gray
Write-Host "3. Subsequent requests should be faster than the first one" -ForegroundColor Gray
Write-Host "4. Open test-cache.html in browser for detailed testing" -ForegroundColor Gray 