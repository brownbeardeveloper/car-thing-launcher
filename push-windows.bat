@echo off
rem Puts the videos on the Car Thing. Just double-click this file.
cd /d "%~dp0"

where bun >nul 2>nul || (
  echo Bun is missing. Open PowerShell, paste this, then run this file again:
  echo     winget install Oven-sh.Bun
  pause & exit /b 1
)
where ffmpeg >nul 2>nul || (
  echo ffmpeg is missing. Open PowerShell, paste this, then run this file again:
  echo     winget install Gyan.FFmpeg
  pause & exit /b 1
)
where ssh >nul 2>nul || (
  echo ssh is missing. Update Windows, then run this file again.
  pause & exit /b 1
)

ping -n 1 -w 3000 bridgething.local >nul 2>nul || (
  echo Car Thing not found. Plug it in with the USB cable, wait for the screen to turn on, then try again.
  pause & exit /b 1
)

if not exist node_modules call bun install
call bun run push %*

echo.
if errorlevel 1 (echo Something went wrong. See the messages above.) else (echo Done! The Car Thing is updated.)
pause
