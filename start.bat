@echo off
echo ====================================
echo Starting Warmth Mental Health App
echo ====================================
echo.

echo Checking backend status...
cd backend
if not exist venv (
    echo Backend not set up. Please run setup.bat first.
    pause
    exit /b 1
)

echo Starting backend server...
start "Warmth Backend" cmd /k "call venv\Scripts\activate && python run.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting mobile app...
cd ..\mobile
start "Warmth Mobile" cmd /k "npm start"

echo.
echo ====================================
echo App Starting Up!
echo ====================================
echo.
echo Backend: http://127.0.0.1:5000
echo Mobile: Check terminal for QR code
echo.
echo Scan QR code with Expo Go app on your phone
echo.
echo Press any key to exit this window...
pause >nul