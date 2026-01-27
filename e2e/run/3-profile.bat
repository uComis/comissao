@echo off
cls

echo ================================================================
echo            TESTE E2E - PROFILE
echo ================================================================
echo.

cd /d "%~dp0..\.."
call npx playwright test e2e/specs/3-profile.spec.ts --headed --workers=1 --timeout=120000

echo.
echo Teste finalizado.
pause
