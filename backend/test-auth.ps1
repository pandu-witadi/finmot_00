# Test script for /api/auth endpoints
Write-Host "=== Testing /api/auth Endpoints ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseURL = "http://localhost:5200/api"
$testEmail = "testuser$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$testPassword = "TestPassword123!"
$testName = "Test User"

# Helper function to make HTTP requests
function Invoke-Request {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null
    )

    $headers = @{
        "Content-Type" = "application/json"
    }

    $bodyJson = $null
    if ($Body) {
        $bodyJson = $Body | ConvertTo-Json
    }

    try {
        if ($Method -eq "POST") {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $bodyJson -TimeoutSec 10
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -TimeoutSec 10
        }
        return $response
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Response: $($_.ErrorDetails)" -ForegroundColor Yellow
        }
        return $null
    }
}

Write-Host "1. Starting backend server..." -ForegroundColor Yellow
Write-Host "   Changing to backend directory..." -ForegroundColor Gray
$backendPath = "E:\code\dev\MFRN\finmot_00\backend"
Set-Location $backendPath

Write-Host "   Checking if server is already running..." -ForegroundColor Gray
try {
    $health = Invoke-Request -Method "GET" -Url "$baseURL/health" -ErrorAction SilentlyContinue
    if ($health) {
        Write-Host "   Server is already running. Skipping start." -ForegroundColor Green
        $serverProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*finmot_00\backend*" }
    }
} catch {
    Write-Host "   Server not running. Starting..." -ForegroundColor Yellow
    # Start the server in a new process
    Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory $backendPath -NoNewWindow -RedirectStandardOutput "$backendPath/server.log" -RedirectStandardError "$backendPath/server-error.log" -PassThru
    Write-Host "   Server starting... waiting 3 seconds for initialization" -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}

# Verify server is running
Write-Host ""
Write-Host "2. Verifying server is running..." -ForegroundColor Yellow
$health = Invoke-Request -Method "GET" -Url "$baseURL/health" -ErrorAction SilentlyContinue
if ($health) {
    Write-Host "   ✓ Server is running" -ForegroundColor Green
    Write-Host "   Health check response:" -ForegroundColor Cyan
    Write-Host "   - Status: $($health.status_db)" -ForegroundColor White
    Write-Host "   - Server time: $($health.server_time)" -ForegroundColor White
} else {
    Write-Host "   ✗ Server failed to start. Check server.log for errors." -ForegroundColor Red
    Write-Host "   Reading server log..." -ForegroundColor Yellow
    if (Test-Path "$backendPath\server.log") {
        Write-Host (Get-Content "$backendPath\server.log" -Raw) -ForegroundColor Yellow
    }
    exit 1
}

Write-Host ""
Write-Host "3. Testing /auth/register endpoint (new user)..." -ForegroundColor Yellow
$registerBody = @{
    email = $testEmail
    password = $testPassword
    name = $testName
}

$registerResponse = Invoke-Request -Method "POST" -Url "$baseURL/auth/register" -Body $registerBody

if ($registerResponse) {
    Write-Host "   ✓ Registration successful!" -ForegroundColor Green
    Write-Host "   Response:" -ForegroundColor Cyan
    Write-Host "   - User ID: $($registerResponse.user.id)" -ForegroundColor White
    Write-Host "   - Email: $($registerResponse.user.email)" -ForegroundColor White
    Write-Host "   - Name: $($registerResponse.user.name)" -ForegroundColor White
    Write-Host "   - Role: $($registerResponse.user.role)" -ForegroundColor White
    Write-Host "   - Access Token: $($registerResponse.accessToken.Substring(0, 20))..." -ForegroundColor White
    $accessToken = $registerResponse.accessToken
} else {
    Write-Host "   ✗ Registration failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. Testing /auth/login endpoint (with registered user)..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
}

$loginResponse = Invoke-Request -Method "POST" -Url "$baseURL/auth/login" -Body $loginBody

if ($loginResponse) {
    Write-Host "   ✓ Login successful!" -ForegroundColor Green
    Write-Host "   Response:" -ForegroundColor Cyan
    Write-Host "   - User ID: $($loginResponse.user.id)" -ForegroundColor White
    Write-Host "   - Email: $($loginResponse.user.email)" -ForegroundColor White
    Write-Host "   - Name: $($loginResponse.user.name)" -ForegroundColor White
    Write-Host "   - Role: $($loginResponse.user.role)" -ForegroundColor White
    Write-Host "   - Access Token: $($loginResponse.accessToken.Substring(0, 20))..." -ForegroundColor White
} else {
    Write-Host "   ✗ Login failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "5. Testing /auth/login endpoint (wrong password)..." -ForegroundColor Yellow
$wrongLoginBody = @{
    email = $testEmail
    password = "WrongPassword123!"
}

$wrongLoginResponse = Invoke-Request -Method "POST" -Url "$baseURL/auth/login" -Body $wrongLoginBody

if (-not $wrongLoginResponse) {
    Write-Host "   ✓ Correctly rejected invalid credentials" -ForegroundColor Green
} else {
    Write-Host "   ✗ Should have rejected invalid credentials" -ForegroundColor Red
}

Write-Host ""
Write-Host "6. Testing /auth/login endpoint (non-existent user)..." -ForegroundColor Yellow
$nonExistentLoginBody = @{
    email = "nonexistent@example.com"
    password = "SomePassword123!"
}

$nonExistentLoginResponse = Invoke-Request -Method "POST" -Url "$baseURL/auth/login" -Body $nonExistentLoginBody

if (-not $nonExistentLoginResponse) {
    Write-Host "   ✓ Correctly rejected non-existent user" -ForegroundColor Green
} else {
    Write-Host "   ✗ Should have rejected non-existent user" -ForegroundColor Red
}

Write-Host ""
Write-Host "7. Testing /auth/register endpoint (duplicate email)..." -ForegroundColor Yellow
$duplicateRegisterBody = @{
    email = $testEmail
    password = "AnotherPassword123!"
    name = "Duplicate User"
}

$duplicateRegisterResponse = Invoke-Request -Method "POST" -Url "$baseURL/auth/register" -Body $duplicateRegisterBody

if (-not $duplicateRegisterResponse -or $duplicateRegisterResponse.error -like "*Already exists*") {
    Write-Host "   ✓ Correctly rejected duplicate email" -ForegroundColor Green
} else {
    Write-Host "   ✗ Should have rejected duplicate email" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== All Tests Completed ===" -ForegroundColor Cyan
Write-Host "Test user created: $testEmail" -ForegroundColor Yellow
Write-Host "Test password: $testPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: To clean up the test user, you can run:" -ForegroundColor Yellow
Write-Host "  db.users.deleteOne({email: '$testEmail'})" -ForegroundColor Gray