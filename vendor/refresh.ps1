# Re-download the vendored libraries. Run from anywhere:
#   powershell -ExecutionPolicy Bypass -File vendor\refresh.ps1
# Pinned to React 18 + the @babel/standalone and Tailwind Play CDN "latest"
# builds the app was originally written against. If you bump these, retest the
# whole app — Babel/Tailwind majors can change behaviour.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$libs = @(
  @{ url = 'https://unpkg.com/react@18/umd/react.development.js';          out = 'react.development.js' },
  @{ url = 'https://unpkg.com/react-dom@18/umd/react-dom.development.js';  out = 'react-dom.development.js' },
  @{ url = 'https://unpkg.com/@babel/standalone/babel.min.js';             out = 'babel.min.js' },
  @{ url = 'https://cdn.tailwindcss.com';                                  out = 'tailwind.play.js' }
)
foreach ($l in $libs) {
  Invoke-WebRequest -Uri $l.url -OutFile (Join-Path $dir $l.out) -UseBasicParsing
  $kb = [math]::Round((Get-Item (Join-Path $dir $l.out)).Length / 1KB, 1)
  Write-Host "OK  $($l.out)  ($kb KB)"
}
