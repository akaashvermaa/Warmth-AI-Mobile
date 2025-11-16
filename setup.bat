@echo off
echo ====================================
echo Setting up Warmth Mental Health App
echo ====================================
echo.

echo [1/4] Setting up Python backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
python setup_nltk.py
echo Backend setup complete!
echo.

echo [2/4] Setting up React Native mobile app...
cd ..\mobile
npm install
echo Mobile app setup complete!
echo.

echo [3/4] Creating launch scripts...
cd ..\backend
echo @echo off > start_backend.bat
echo echo Starting Warmth Backend... >> start_backend.bat
echo call venv\Scripts\activate >> start_backend.bat
echo python run.py >> start_backend.bat

cd ..\mobile
echo @echo off > start_mobile.bat
echo echo Starting Warmth Mobile App... >> start_mobile.bat
echo npm start >> start_mobile.bat

echo Launch scripts created!
echo.

echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo To run the app:
echo.
echo Step 1: Start Backend
echo   - Open backend\start_backend.bat
echo.
echo Step 2: Start Mobile App
echo   - Open mobile\start_mobile.bat
echo   - Scan QR code with Expo Go app
echo.
echo Your Warmth app is ready to use! 🎉
echo.
pause