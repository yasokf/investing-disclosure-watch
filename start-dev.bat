@echo off
setlocal

if not exist node_modules (
  npm.cmd install --no-audit --no-fund
)

start "Next.js Dev Server" cmd /c "npm.cmd run dev"
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000/watchlist"

endlocal
