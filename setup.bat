@echo off
echo ========================================
echo  SGC-Trazabilidad - Instalacion
echo ========================================
echo.

echo [1/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no encontrado. Instale Python 3.11+ desde https://python.org
    pause
    exit /b 1
)
echo Python encontrado.

echo.
echo [2/4] Creando entorno virtual...
if not exist "venv" (
    python -m venv venv
    echo Entorno virtual creado.
) else (
    echo Entorno virtual ya existe.
)

echo.
echo [3/4] Activando entorno virtual e instalando dependencias...
call venv\Scripts\activate
pip install -r backend\requirements.txt

echo.
echo [4/4] Iniciando servidor...
echo.
echo ========================================
echo  Backend: http://localhost:8000
echo  Docs: http://localhost:8000/api/docs
echo  Frontend: http://localhost:3000
echo ========================================
echo.
cd backend
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
