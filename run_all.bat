@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo ===================================================
echo Starting life-record-hub project...
echo ===================================================

echo Starting backend service...
start "Backend" cmd /c "cd backend && python -m uvicorn app.main:app --reload"

echo Starting frontend development server...
start "Frontend" cmd /c "cd frontend && npm run dev"

echo ===================================================
echo Services are starting in separate windows.
echo Backend URL: http://localhost:8000
echo Frontend URL: http://localhost:5178
echo ===================================================
echo.
echo Press Ctrl+C in this window to stop all services.
echo Press any key to close this window...
pause >nul