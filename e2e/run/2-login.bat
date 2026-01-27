@echo off
cls

echo ================================================================
echo            TESTE E2E - LOGIN
echo ================================================================
echo.

cd /d "%~dp0..\.."
call npx playwright test e2e/specs/2-login.spec.ts --headed --workers=1 --timeout=120000

echo.
echo Teste finalizado.
pause
