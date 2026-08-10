$ErrorActionPreference = "Stop"

# Title
Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    CIRCULO 1 - INICIANDO ENTORNO DE DESARROLLO LOCAL     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repo

# 1. Verificar si PostgreSQL esta respondiendo en el puerto 5432
Write-Host "Verificando conexion a PostgreSQL local en puerto 5432..." -ForegroundColor Yellow
$portOpen = Test-NetConnection 127.0.0.1 -Port 5432 -InformationLevel Quiet

if (-not $portOpen) {
    Write-Host "Error: PostgreSQL no esta corriendo en el puerto 5432." -ForegroundColor Red
    Write-Host "Por favor, asegurate de que el servicio de PostgreSQL este iniciado en tu maquina." -ForegroundColor Yellow
    Write-Host "Servicios de PostgreSQL detectados en este sistema:" -ForegroundColor Gray
    Get-Service -Name *postgres* | Out-String | Write-Host -ForegroundColor Gray
    exit 1
}
Write-Host "PostgreSQL detectado y escuchando en el puerto 5432." -ForegroundColor Green
Write-Host ""

# 2. Copiar .env a la carpeta backend si no existe
$backendEnv = Join-Path $repo "backend\.env"
$rootEnv = Join-Path $repo ".env"

if (-not (Test-Path $backendEnv)) {
    if (Test-Path $rootEnv) {
        Write-Host "Copiando archivo de configuracion .env a la carpeta del backend..." -ForegroundColor Yellow
        Copy-Item -Path $rootEnv -Destination $backendEnv -Force
        Write-Host "Archivo .env copiado con exito." -ForegroundColor Green
    } else {
        Write-Host "Error: No se encontro el archivo .env en la raiz del proyecto." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Archivo .env ya existe en la carpeta del backend." -ForegroundColor Green
}
Write-Host ""

# 3. Verificar dependencias de Node
Write-Host "Verificando dependencias de Node..." -ForegroundColor Yellow

$backendNodeModules = Join-Path $repo "backend\node_modules"
$frontendNodeModules = Join-Path $repo "frontend\node_modules"

if (-not (Test-Path $backendNodeModules)) {
    Write-Host "backend: Instalando dependencias (npm install)..." -ForegroundColor Cyan
    Push-Location (Join-Path $repo "backend")
    & npm install
    Pop-Location
    Write-Host "Dependencias de backend instaladas." -ForegroundColor Green
} else {
    Write-Host "Dependencias de backend ya estan instaladas." -ForegroundColor Green
}

if (-not (Test-Path $frontendNodeModules)) {
    Write-Host "frontend: Instalando dependencias (npm install)..." -ForegroundColor Cyan
    Push-Location (Join-Path $repo "frontend")
    & npm install
    Pop-Location
    Write-Host "Dependencias de frontend instaladas." -ForegroundColor Green
} else {
    Write-Host "Dependencias de frontend ya estan instaladas." -ForegroundColor Green
}
Write-Host ""

# 4. Sincronizar Prisma y base de datos
Write-Host "Sincronizando esquema de base de datos..." -ForegroundColor Yellow
Push-Location (Join-Path $repo "backend")
& npx prisma generate
Pop-Location
Write-Host "Prisma Client generado." -ForegroundColor Green
Write-Host ""

# 5. Iniciar Backend en una nueva ventana de PowerShell (sin el parametro -Title que no existe en Start-Process)
Write-Host "Iniciando Backend (API) en puerto 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.ui.RawUI.WindowTitle='Circulo 1 - Backend API'; cd '$repo\backend'; Write-Host '=== SERVIDOR BACKEND (API) ===' -ForegroundColor Cyan; npm run dev"

# 6. Iniciar Frontend en una nueva ventana de PowerShell (sin el parametro -Title que no existe en Start-Process)
Write-Host "Iniciando Frontend (Vite) en puerto 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$host.ui.RawUI.WindowTitle='Circulo 1 - Frontend App'; cd '$repo\frontend'; Write-Host '=== SERVIDOR FRONTEND (VITE) ===' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Entorno de desarrollo iniciado!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Nota: Puedes ver los logs del Backend y Frontend en las ventanas que se acaban de abrir." -ForegroundColor Gray
Write-Host "Puedes cerrar esta ventana de PowerShell." -ForegroundColor Gray
