@echo off
setlocal

npm.cmd install
start "Next.js Dev Server" npm.cmd run dev
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000/watchlist"

endlocal
