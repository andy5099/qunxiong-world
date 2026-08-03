$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (py -m pip show Pillow 2>$null)) {
  py -m pip install Pillow
}
py installer/scan_assets.py
Write-Host "`nReports written to reports/"
