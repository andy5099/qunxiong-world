@echo off
setlocal
cd /d "%~dp0"
py -m pip show Pillow >nul 2>nul
if errorlevel 1 (
  echo Installing Pillow...
  py -m pip install Pillow
  if errorlevel 1 exit /b 1
)
py installer\scan_assets.py
echo.
echo Reports written to reports\
pause
