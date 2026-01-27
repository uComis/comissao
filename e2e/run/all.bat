@echo off
cls

echo ================================================================
echo            TESTES E2E - TODOS OS TESTES
echo.
echo   Cadeia: Register - Login - Profile - Subscribe - Upgrade
echo   UI: Downgrade - Cancel
echo ================================================================
echo.

echo [1/2] Limpando relatorios anteriores...
if exist "%~dp0..\..\playwright-report" rmdir /s /q "%~dp0..\..\playwright-report" 2>nul
if exist "%~dp0..\..\test-results" rmdir /s /q "%~dp0..\..\test-results" 2>nul
echo.

echo ================================================================
echo  INICIANDO TESTES E2E
echo ================================================================
echo.

cd /d "%~dp0..\.."
call npx playwright test --headed --workers=1 --reporter=html --timeout=120000

echo.
echo ================================================================
echo  TESTES FINALIZADOS
echo ================================================================
echo.

echo Abrindo relatorio do Playwright...
call npx playwright show-report

pause
