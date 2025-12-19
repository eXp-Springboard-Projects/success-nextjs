@echo off
REM SUCCESS.com Setup Script (Windows)
REM Run this script to set up the project for deployment

echo ===================================
echo SUCCESS.com Setup Script
echo ===================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo Creating .env.local from example...
    copy .env.production.example .env.local
    echo.
    echo WARNING: Please update .env.local with your actual values
    echo.
)

REM Install dependencies
echo.
echo Installing dependencies...
call npm install
if errorlevel 1 goto error

REM Generate Prisma client
echo.
echo Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo.
    echo WARNING: Prisma generate failed
    echo This might be due to locked files. Try closing dev servers and run again.
    echo.
)

REM Build the project
echo.
echo Building project...
call npm run build
if errorlevel 1 goto error

REM Success message
echo.
echo ===================================
echo Setup complete!
echo ===================================
echo.
echo Next steps:
echo 1. Update .env.local with your values
echo 2. Generate NEXTAUTH_SECRET: openssl rand -base64 32
echo 3. Set up database: npx prisma migrate deploy
echo 4. Create admin user (see DEPLOYMENT_QUICK_START.md)
echo 5. Start dev: npm run dev
echo 6. Or deploy: vercel --prod
echo.
echo See DEPLOYMENT_QUICK_START.md for details
echo.
goto end

:error
echo.
echo ===================================
echo Setup failed!
echo ===================================
echo Please check the error messages above
exit /b 1

:end
