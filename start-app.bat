@echo off
setlocal

if not exist node_modules (
  npm.cmd install
)

if not exist .next (
  npm.cmd run build
)

start "Next.js App Server" npm.cmd run start

timeout /t 3 /nobreak >nul
start "" "http://localhost:3000/watchlist"

endlocal
