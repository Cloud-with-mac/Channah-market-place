@echo off
echo Starting Customer Mobile App...
echo.

cd customer-app

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies first...
    npm install
    echo.
)

echo.
echo ==================================================
echo IMPORTANT: Before scanning QR code
echo ==================================================
echo.
echo 1. Find your IP: Run 'ipconfig' in another terminal
echo 2. Update: mobile/shared/api/client.ts (line 7)
echo 3. Change to: const API_BASE_URL = 'http://YOUR_IP:8000/api/v1';
echo.
echo Backend must be running with:
echo    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo ==================================================
echo.

pause
npm start
