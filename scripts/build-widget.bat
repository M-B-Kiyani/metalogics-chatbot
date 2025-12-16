@echo off
echo ========================================
echo Building Metalogics AI Assistant Widget
echo ========================================
echo.

cd widget

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    exit /b 1
)
echo.

echo [2/4] Building widget...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Failed to build widget
    exit /b 1
)
echo.

echo [3/4] Verifying build output...
if not exist "dist\metalogics-widget.js" (
    echo Error: Build output not found
    exit /b 1
)
echo.

echo [4/4] Build complete!
echo.
echo ========================================
echo Widget built successfully!
echo ========================================
echo.
echo Output: widget\dist\metalogics-widget.js
echo.
echo Next steps:
echo 1. Test locally: cd widget ^&^& npm run serve
echo 2. Deploy to CDN
echo 3. Integrate into website
echo.
echo See widget\QUICKSTART.md for details
echo.

cd ..
