@echo off
echo Запуск AsNodt...
echo.

REM Проверка наличия Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Ошибка: Node.js не установлен!
    echo Пожалуйста, установите Node.js с сайта https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Установка пути к MongoDB
set "MONGODB_PATH=C:\Program Files\MongoDB\Server\8.0\bin"
if not exist "%MONGODB_PATH%\mongod.exe" (
    echo Ошибка: MongoDB не найдена по пути %MONGODB_PATH%!
    echo Пожалуйста, убедитесь что MongoDB установлена корректно.
    echo.
    pause
    exit /b 1
)

REM Добавление пути к MongoDB в PATH
set "PATH=%MONGODB_PATH%;%PATH%"

REM Проверка наличия package.json
if not exist package.json (
    echo Ошибка: Файл package.json не найден!
    echo Убедитесь, что вы находитесь в корневой директории проекта.
    echo.
    pause
    exit /b 1
)

REM Установка зависимостей, если node_modules не существует
if not exist node_modules (
    echo Установка зависимостей...
    call npm install
    if %errorlevel% neq 0 (
        echo Ошибка при установке зависимостей!
        echo.
        pause
        exit /b 1
    )
)

REM Создание директории для данных MongoDB, если она не существует
if not exist "data\db" (
    echo Создание директории для данных MongoDB...
    mkdir "data\db"
)

REM Запуск MongoDB (если не запущена)
echo Проверка запуска MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Запуск MongoDB...
    start /B mongod --dbpath=./data/db
    timeout /t 5 /nobreak >nul
)

REM Запуск сервера
echo Запуск сервера...
start /B node server.js

REM Ожидание запуска сервера
echo Ожидание запуска сервера...
timeout /t 3 /nobreak >nul

REM Открытие веб-страницы в браузере
echo Открытие веб-страницы...
start http://localhost:3000

echo.
echo AsNodt успешно запущен!
echo Для остановки сервера нажмите Ctrl+C в этом окне.
echo.

REM Ожидание нажатия Ctrl+C для остановки сервера
:loop
timeout /t 1 /nobreak >nul
goto loop 