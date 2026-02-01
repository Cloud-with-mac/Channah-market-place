@echo off
echo Starting Channah Marketplace Backend Server...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start uvicorn with mobile-friendly settings
echo Backend will be accessible at:
echo   - Computer: http://localhost:8000/docs
echo   - Mobile: http://YOUR_IP:8000/docs
echo.
echo IMPORTANT: Replace YOUR_IP with your actual IP address (run 'ipconfig' to find it)
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
