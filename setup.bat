@echo off
REM ========================================
REM SETUP AUTOMATIQUE - PROMPT ENGINEERING PLATFORM
REM ========================================

echo.
echo  ======================================================
echo  Installation de la Plateforme E-Learning
echo  Prompt Engineering Academy
echo  ======================================================
echo.

REM Vérifier Node.js
echo Verification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe.
    echo Veuillez installer Node.js 18+ depuis https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js detecte

REM Installer les dépendances
echo.
echo Installation des dependances npm...
call npm install

REM Créer .env.local si nécessaire
if not exist .env.local (
    echo.
    echo Creation du fichier .env.local...
    copy NUL .env.local >nul
    echo # Supabase Configuration>> .env.local
    echo NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here>> .env.local
    echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here>> .env.local
    echo SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here>> .env.local
    echo.>> .env.local
    echo # App Configuration>> .env.local
    echo NEXT_PUBLIC_APP_URL=http://localhost:3000>> .env.local
    echo NEXT_PUBLIC_APP_NAME="Prompt Engineering Academy">> .env.local
)

echo.
echo  ======================================================
echo  Installation terminee !
echo  ======================================================
echo.
echo  Prochaines etapes :
echo  1. Configurez votre projet Supabase sur https://app.supabase.com
echo  2. Mettez a jour .env.local avec vos cles Supabase
echo  3. Executez les migrations SQL dans Supabase Dashboard
echo  4. Lancez le serveur : npm run dev
echo.
echo  Documentation complete dans README.md
echo.
pause
