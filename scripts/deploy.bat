@echo off
setlocal enabledelayedexpansion

REM ============================================
REM Script de Déploiement Rapide GENIA v2.1
REM Version Windows
REM ============================================

echo ================================================
echo    🚀 DEPLOIEMENT GENIA WEB TRAINING v2.1
echo ================================================
echo.

REM 1. Vérification pré-déploiement
echo [ETAPE 1] Verification pre-deploiement...
if exist "scripts\pre-deployment-check.js" (
    node scripts\pre-deployment-check.js
    if !errorlevel! neq 0 (
        echo ❌ La verification pre-deploiement a echoue.
        echo    Corrigez les erreurs avant de continuer.
        pause
        exit /b 1
    )
) else (
    echo ⚠️  Script de verification non trouve. Continuons...
)
echo.

REM 2. Vérification du fichier .env.local
echo [ETAPE 2] Verification de la configuration...
if not exist ".env.local" (
    echo ❌ Le fichier .env.local n'existe pas.
    echo    Creez-le a partir de .env.example
    pause
    exit /b 1
)

REM Vérifier les variables essentielles
findstr /C:"NEXT_PUBLIC_SUPABASE_URL=" .env.local >nul
if !errorlevel! neq 0 (
    echo ❌ Variable manquante: NEXT_PUBLIC_SUPABASE_URL
    pause
    exit /b 1
)

findstr /C:"NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local >nul
if !errorlevel! neq 0 (
    echo ❌ Variable manquante: NEXT_PUBLIC_SUPABASE_ANON_KEY
    pause
    exit /b 1
)

findstr /C:"MISTRAL_API_KEY=" .env.local >nul
if !errorlevel! neq 0 (
    echo ❌ Variable manquante: MISTRAL_API_KEY
    pause
    exit /b 1
)

echo ✅ Configuration verifiee
echo.

REM 3. Installation des dépendances
echo [ETAPE 3] Installation des dependances...
call npm install
if !errorlevel! equ 0 (
    echo ✅ Dependances installees
) else (
    echo ❌ Erreur lors de l'installation des dependances
    pause
    exit /b 1
)
echo.

REM 4. Build de production
echo [ETAPE 4] Build de production...
call npm run build
if !errorlevel! equ 0 (
    echo ✅ Build reussi
) else (
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)
echo.

REM 5. Tests (optionnel)
echo [ETAPE 5] Tests...
findstr /C:"\"test\"" package.json >nul
if !errorlevel! equ 0 (
    call npm test -- --passWithNoTests
    if !errorlevel! equ 0 (
        echo ✅ Tests passes
    ) else (
        echo ⚠️  Certains tests ont echoue
    )
) else (
    echo ⚠️  Pas de tests configures
)
echo.

REM 6. Git status
echo [ETAPE 6] Verification Git...
if exist ".git" (
    git status --porcelain >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "tokens=*" %%i in ('git status --porcelain') do (
            set has_changes=1
            goto :git_changes
        )
        :git_changes
        if defined has_changes (
            echo ⚠️  Des changements non commites detectes
            git status --short
            echo.
            set /p commit_choice="Voulez-vous commiter ces changements? (o/n): "
            if /i "!commit_choice!"=="o" (
                git add .
                set /p commit_msg="Message de commit: "
                if "!commit_msg!"=="" set commit_msg=Release v2.1
                git commit -m "!commit_msg!"
                echo ✅ Changements commites
            )
        ) else (
            echo ✅ Aucun changement non commite
        )
    )
) else (
    echo ⚠️  Pas de repository Git initialise
)
echo.

REM 7. Déploiement
echo [ETAPE 7] Options de deploiement...
echo.
echo Choisissez votre methode de deploiement:
echo 1) Vercel (recommande)
echo 2) Export statique
echo 3) Passer cette etape
echo.
set /p deploy_choice="Votre choix (1-3): "

if "!deploy_choice!"=="1" (
    echo Deploiement sur Vercel...
    where vercel >nul 2>&1
    if !errorlevel! equ 0 (
        call vercel --prod
        echo ✅ Deploiement Vercel lance
    ) else (
        echo ⚠️  Vercel CLI non installe
        echo    Installez avec: npm i -g vercel
    )
) else if "!deploy_choice!"=="2" (
    echo Export statique...
    call npm run export
    echo ✅ Export cree dans /out
) else if "!deploy_choice!"=="3" (
    echo Deploiement ignore
) else (
    echo ⚠️  Choix invalide
)
echo.

REM 8. Instructions finales
echo ================================================
echo            📋 ETAPES FINALES
echo ================================================
echo.
echo Si vous avez deploye sur Vercel:
echo 1. Allez sur https://vercel.com/dashboard
echo 2. Configurez les variables d'environnement
echo 3. Ajoutez votre domaine personnalise
echo.
echo Sur Supabase (Production):
echo 1. Creez un nouveau projet si necessaire
echo 2. Executez les migrations dans l'ordre:
echo    - 001_initial_schema.sql
echo    - 003_genia_chat_tables.sql
echo    - 004_init_demo_accounts.sql (optionnel)
echo    - 005_update_rate_limits.sql
echo    - 006_hybrid_content_system.sql
echo    - 007_feedback_system.sql
echo    - 008_genia_memory_system.sql
echo    - 009_daily_challenges_system.sql
echo.
echo Tests finaux:
echo 1. Testez la creation de compte
echo 2. Testez la connexion
echo 3. Testez le chat GENIA
echo 4. Verifiez le dashboard admin
echo.
echo ✅ Script de deploiement termine!
echo.
echo ================================================
echo      🎉 GENIA WEB TRAINING v2.1 PRET!
echo ================================================
echo.
pause
