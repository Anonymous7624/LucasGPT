# LucasGPT Setup Script for Windows PowerShell

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  LucasGPT Setup Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Backend Setup
Write-Host "Setting up backend..." -ForegroundColor Yellow
Set-Location backend

if (-Not (Test-Path ".env")) {
    Write-Host "Creating backend .env file..." -ForegroundColor Gray
    Copy-Item .env.example .env
    
    # Generate JWT secret
    $JWT_SECRET = -join ((1..64) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
    
    # Update .env with generated secret
    (Get-Content .env) | ForEach-Object {
        $_ -replace 'change_this_to_a_long_random_secret', $JWT_SECRET
    } | Set-Content .env
    
    Write-Host "✓ Backend .env created with secure JWT secret" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: Edit backend/.env and change ADMIN_PASSWORD!" -ForegroundColor Yellow
} else {
    Write-Host "✓ Backend .env already exists" -ForegroundColor Green
}

Write-Host "Installing backend dependencies..." -ForegroundColor Gray
npm install
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

Set-Location ..

# Frontend Setup
Write-Host ""
Write-Host "Setting up frontend..." -ForegroundColor Yellow
Set-Location frontend

if (-Not (Test-Path ".env")) {
    Write-Host "Creating frontend .env file..." -ForegroundColor Gray
    Copy-Item .env.example .env
    Write-Host "✓ Frontend .env created" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend .env already exists" -ForegroundColor Green
}

Write-Host "Installing frontend dependencies..." -ForegroundColor Gray
npm install
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "1. Edit backend\.env and change ADMIN_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the backend:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. In a new terminal, start the frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "5. Login to admin at http://localhost:5173/admin/login" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
