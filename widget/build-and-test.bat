@echo off
REM Metalogics Chatbot Widget - Build and Test Script (Windows)
REM This script builds the widget and starts a local server for testing

echo.
echo ========================================
echo Metalogics Chatbot Widget - Build ^& Test
echo ========================================
echo.

REM Check if we're in the widget directory
if not exist "package.json" (
    echo Error: package.json not found
    echo Please run this script from the widget directory:
    echo   cd widget ^&^& build-and-test.bat
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        exit /b 1
    )
    echo Dependencies installed
    echo.
)

REM Build the widget
echo Building widget...
call npm run build

if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

echo Build successful!
echo.

REM Show file sizes
echo Build Output:
echo ----------------
if exist "dist\metalogics-chatbot.iife.js" (
    for %%A in ("dist\metalogics-chatbot.iife.js") do echo   metalogics-chatbot.iife.js: %%~zA bytes
)
if exist "dist\metalogics-chatbot.css" (
    for %%A in ("dist\metalogics-chatbot.css") do echo   metalogics-chatbot.css: %%~zA bytes
)
echo.

REM Ask if user wants to test
set /p response="Would you like to start the test server? (y/n): "

if /i "%response%"=="y" (
    echo.
    echo Starting test server...
    echo Open http://localhost:4173 in your browser
    echo Press Ctrl+C to stop the server
    echo.
    call npm run serve
) else (
    echo.
    echo Build complete! Files are in the dist\ folder
    echo.
    echo Next steps:
    echo 1. Upload dist\metalogics-chatbot.iife.js to your CDN
    echo 2. Upload dist\metalogics-chatbot.css to your CDN
    echo 3. Add the integration code to your website
    echo.
    echo See INTEGRATION_GUIDE.md for detailed instructions
)
