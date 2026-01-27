@echo off
cls

echo ================================================================
echo            PLAYWRIGHT UI MODE
echo.
echo   - Selecione o teste na lista a esquerda
echo   - Clique no play para rodar
echo   - Ative "Show browser" para ver o navegador
echo ================================================================
echo.

cd /d "%~dp0..\.."
npx playwright test --ui --headed

pause
