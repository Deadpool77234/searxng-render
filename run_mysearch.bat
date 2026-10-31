@echo off
setlocal enabledelayedexpansion
title MySearch Personal Search Platform v4.1 Launcher

echo ==========================================================
echo    MySearch Personal Search Platform v4.1
echo    Mobile + Desktop Federated Search Engine
echo ==========================================================

set WORKSPACE=C:\Users\autid\OneDrive\Pictures\Desktop\mysearch
set SCRATCH=C:\Users\autid\.gemini\antigravity\brain\b0929a3e-773a-4262-8363-dc23803c9e9a\scratch
set PYTHON_EXE=C:\Users\autid\AppData\Local\Programs\Python\Python313\python.exe
set BACKEND_DIR=C:\Users\autid\AppData\Local\Temp\mysearch_backend
set FRONTEND_DIR=%SCRATCH%\frontend

:: Detect Local IP Address for Mobile Access
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|vEthernet' -and $_.IPAddress -notlike '169.254*' }).IPAddress | Select-Object -First 1"') do set LOCAL_IP=%%a

if "%LOCAL_IP%"=="" set LOCAL_IP=127.0.0.1

:: Try workspace venv first, fall back to Python313
if exist "%WORKSPACE%\.venv\Scripts\python.exe" (
    set PYTHON_EXE=%WORKSPACE%\.venv\Scripts\python.exe
    set BACKEND_DIR=%WORKSPACE%
)

echo.
echo [1/2] Starting FastAPI Backend on 0.0.0.0:8000 ...
start "MySearch Backend" /min cmd /c "cd /d "%BACKEND_DIR%" && "%PYTHON_EXE%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 2>&1"

echo [2/2] Starting Frontend on 0.0.0.0:5500 ...
set FRONTEND_SRC=%WORKSPACE%\frontend
if not exist "%FRONTEND_SRC%\index.html" set FRONTEND_SRC=%FRONTEND_DIR%
start "MySearch Frontend" /min cmd /c ""%PYTHON_EXE%" -m http.server 5500 --bind 0.0.0.0 --directory "%FRONTEND_SRC%""

echo.
echo Waiting 3 seconds for services to initialize...
timeout /t 3 /nobreak >nul

echo Opening MySearch on your desktop...
start http://localhost:5500

echo.
echo ==========================================================
echo  MySearch v4.1 is running!
echo.
echo  [DESKTOP PC]
echo  Frontend : http://localhost:5500
echo  Backend  : http://localhost:8000
echo  API Docs : http://localhost:8000/docs
echo.
echo  [MOBILE PHONE ON WI-FI]
echo  Open on Phone: http://%LOCAL_IP%:5500
echo  Tip: In mobile Chrome/Safari, tap 'Add to Home Screen'
echo  to install MySearch as an app!
echo ==========================================================
echo  Keep this window open. Close it to stop servers.
echo ==========================================================
pause
