@echo off
title LIMINAL Server
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js ist nicht installiert - bitte von https://nodejs.org installieren.
  pause
  exit /b 1
)
node server.js
pause
