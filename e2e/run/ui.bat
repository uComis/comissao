@echo off
cls

cd /d "%~dp0..\.."

REM Lê E2E_BASE_URL do .env
for /f "tokens=2 delims==" %%a in ('findstr /r "^E2E_BASE_URL=" .env') do set E2E_URL=%%a

echo ================================================================
echo            PLAYWRIGHT UI MODE
echo.
echo   Ambiente: %E2E_URL%
echo.
echo   - Selecione o teste na lista a esquerda
echo   - Clique no play para rodar
echo   - Ative "Show browser" para ver o navegador
echo ================================================================
echo.

npx playwright test --ui --headed
if errorlevel 1 (
    echo.
    echo ================================================================
    echo   ERRO: Playwright falhou. Verifique a mensagem acima.
    echo ================================================================
)

pause
