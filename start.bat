@echo off
echo ==========================================
echo   DIFORMA APU Calculator - Iniciando...
echo ==========================================

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no encontrado. Instala Python 3.11+
    pause
    exit /b 1
)

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no encontrado. Instala Node.js 18+
    pause
    exit /b 1
)

:: Backend setup
echo.
echo [1/4] Instalando dependencias del backend...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt --quiet

echo [2/4] Inicializando base de datos...
python seed_data.py

echo [3/4] Iniciando backend en puerto 8000...
start "DIFORMA Backend" cmd /k "call venv\Scripts\activate && python main.py"

:: Frontend setup
cd ..\frontend
echo [4/4] Instalando dependencias del frontend...
if not exist node_modules (
    call npm install
)

echo.
echo Iniciando frontend en puerto 5173...
start "DIFORMA Frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  API Docs: http://localhost:8000/docs
echo ==========================================
echo.
echo Abriendo la aplicacion en el navegador...
timeout /t 3 >nul
start http://localhost:5173

cd ..
