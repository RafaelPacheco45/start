@echo off
setlocal

cd /d "%~dp0"

set "PORT=4173"
set "URL=http://localhost:%PORT%/"

echo Iniciando AutoZap Start...
echo Pasta: %CD%
echo URL: %URL%
echo.

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  start "" "%URL%"
  py -m http.server %PORT%
  goto :end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  start "" "%URL%"
  python -m http.server %PORT%
  goto :end
)

echo Python nao encontrado.
echo Instale o Python ou rode manualmente com outro servidor estatico.
echo.
pause

:end
endlocal
