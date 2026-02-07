@echo off
setlocal
cd /d %~dp0
set HOST=127.0.0.1
set PORT=3000

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
  echo Port %PORT% is already in use. Stop the existing process or change PORT.
  exit /b 1
)

if not exist node_modules (
  npm install
)

if not exist .next\BUILD_ID (
  npm run build
)

start "DisclosureWatchServer" /min cmd /c "set HOSTNAME=%HOST%&& set PORT=%PORT%&& npm run start"

powershell -NoProfile -Command ^
"for($i=0;$i -lt 60;$i++){try{(Invoke-WebRequest -UseBasicParsing http://%HOST%:%PORT%/).StatusCode;break}catch{Start-Sleep 1}}; Start-Process http://%HOST%:%PORT%/"

endlocal
