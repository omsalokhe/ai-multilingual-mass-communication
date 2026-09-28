@echo off
title AI Mass Communication Platform Starter
echo ===================================================
echo Starting AI Mass Communication Platform
echo ===================================================

echo [1/2] Starting Backend Server (FastAPI on http://localhost:8000)...
start "Backend - FastAPI" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [2/2] Starting Frontend App (Vite on http://localhost:5173)...
start "Frontend - Vite" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================================
echo Backend API : http://localhost:8000
echo API Docs    : http://localhost:8000/docs
echo Frontend App: http://localhost:5173
echo ===================================================
echo Both services are opening in separate windows.
pause
