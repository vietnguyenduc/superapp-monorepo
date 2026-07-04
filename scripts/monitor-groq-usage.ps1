# Groq Rate Limit Monitor
# Checks OpenHands logs for Groq API usage and warns if approaching limits
# Groq Free Tier: ~30 requests/minute, ~1000 requests/day

param(
    [int]$WarnThreshold = 25,
    [int]$CriticalThreshold = 30,
    [string]$LogPath = "$env:USERPROFILE\.openhands\logs"
)

$now = Get-Date
$oneMinuteAgo = $now.AddMinutes(-1)
$oneDayAgo = $now.AddDays(-1)

Write-Host "=== Groq Rate Limit Monitor ===" -ForegroundColor Cyan
Write-Host "Time: $now" -ForegroundColor Gray

# Count Groq requests in last minute from Docker logs
$recentLogs = docker logs openhands-app --since 1m 2>&1 | Select-String "groq"
$requestsLastMinute = ($recentLogs | Measure-Object).Count

# Count Groq requests in last hour
$hourLogs = docker logs openhands-app --since 1h 2>&1 | Select-String "groq"
$requestsLastHour = ($hourLogs | Measure-Object).Count

Write-Host "Requests last 1 min : $requestsLastMinute" -ForegroundColor $(if ($requestsLastMinute -ge $CriticalThreshold) { "Red" } elseif ($requestsLastMinute -ge $WarnThreshold) { "Yellow" } else { "Green" })
Write-Host "Requests last 1 hour: $requestsLastHour" -ForegroundColor Gray

if ($requestsLastMinute -ge $CriticalThreshold) {
    Write-Host "CRITICAL: Rate limit likely hit! Pausing would be recommended." -ForegroundColor Red
    Write-Host "Groq free tier: ~30 req/min. Current: $requestsLastMinute req/min" -ForegroundColor Red
    exit 2
}
elseif ($requestsLastMinute -ge $WarnThreshold) {
    Write-Host "WARNING: Approaching rate limit ($requestsLastMinute/$CriticalThreshold req/min)" -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "OK: Within safe limits" -ForegroundColor Green
    exit 0
}
