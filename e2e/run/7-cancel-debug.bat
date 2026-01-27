@echo off
cls

echo ================================================================
echo            TESTE E2E - CANCEL (DEBUG)
echo ================================================================
echo.

cd /d "%~dp0..\.."
set E2E_DEBUG=true
call npx playwright test e2e/specs/7-cancel.spec.ts --headed --workers=1 --timeout=180000

echo.
echo Teste finalizado.
pause
