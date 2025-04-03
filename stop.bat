@echo off
echo Остановка AsNodt...
echo.

REM Остановка сервера Node.js
echo Остановка сервера...
taskkill /F /IM node.exe >nul 2>nul
if %errorlevel% equ 0 (
    echo Сервер успешно остановлен.
) else (
    echo Сервер не был запущен или уже остановлен.
)

REM Остановка MongoDB (опционально, раскомментируйте если нужно)
REM echo Остановка MongoDB...
REM taskkill /F /IM mongod.exe >nul 2>nul
REM if %errorlevel% equ 0 (
REM     echo MongoDB успешно остановлена.
REM ) else (
REM     echo MongoDB не была запущена или уже остановлена.
REM )

echo.
echo AsNodt полностью остановлен.
echo.
pause 