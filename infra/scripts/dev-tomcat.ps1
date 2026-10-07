<#
.SYNOPSIS
    Script tự động build, deploy và khởi chạy Apache Tomcat 10.1 cho WebChicKen.
.DESCRIPTION
    Hỗ trợ các hành động:
      - run   : Build WAR -> Copy vào webapps/ROOT.war -> Chạy Tomcat trực tiếp trên Terminal.
      - debug : Tương tự 'run' nhưng bật JPDA Debug trên cổng 8000 để bắt breakpoint trong IDE.
      - stop  : Dừng Tomcat đang chạy.
      - build : Chỉ build WAR bằng Maven wrapper.
#>

param (
    [Parameter(Position = 0)]
    [ValidateSet("run", "debug", "stop", "build")]
    [string]$Action = "run",

    [string]$TomcatHome = "D:\LTweb\apache-tomcat-10.1.60",
    [string]$JdkHome = "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot"
)

$ErrorActionPreference = "Stop"

# Thiết lập thư mục gốc của repo
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = (Resolve-Path "$ScriptDir\..\..").Path
$BackendDir = Join-Path $WorkspaceRoot "backend-servlet"

# 1. Cấu hình JAVA_HOME
if (Test-Path $JdkHome) {
    $env:JAVA_HOME = $JdkHome
    $env:PATH = "$JdkHome\bin;$env:PATH"
} elseif (-not $env:JAVA_HOME) {
    Write-Warning "JAVA_HOME chua duoc dat, he thong se dung phien ban Java mac dinh tren PATH."
}

# Nạp biến môi trường từ .env (nếu có)
$EnvFiles = @(
    (Join-Path $WorkspaceRoot ".env"),
    (Join-Path $BackendDir ".env")
)
foreach ($envFile in $EnvFiles) {
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            $line = $_.Trim()
            if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
                $parts = $line.Split("=", 2)
                $key = $parts[0].Trim()
                $val = $parts[1].Trim()
                [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
            }
        }
        Write-Host ">>> Da nap bien moi truong tu: $envFile" -ForegroundColor Cyan
    }
}

# 2. Kiểm tra và cấu hình Tomcat
if (-not (Test-Path $TomcatHome)) {
    Write-Error "Khong tim thay thu muc Tomcat tai: $TomcatHome. Vui long kiem tra lai duong dan!"
    exit 1
}

$env:CATALINA_HOME = $TomcatHome
$env:CATALINA_BASE = $TomcatHome

$CatalinaBat = Join-Path $TomcatHome "bin\catalina.bat"
$WebappsDir = Join-Path $TomcatHome "webapps"

# 3. Xử lý theo từng Action
switch ($Action) {
    "stop" {
        Write-Host ">>> Dang dung Tomcat..." -ForegroundColor Yellow
        & $CatalinaBat stop
        # Cho 2 giay, neu port 8080 van bi chiem thi kill process
        Start-Sleep -Seconds 2
        $connections = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
            Write-Host ">>> Da giai phong port 8080 thanh cong." -ForegroundColor Green
        }
        break
    }

    "build" {
        Write-Host ">>> Dang build backend-servlet (WAR)..." -ForegroundColor Cyan
        Push-Location $BackendDir
        try {
            cmd /c "mvnw.cmd clean package -DskipTests"
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Build Maven that bai!"
                exit $LASTEXITCODE
            }
        } finally {
            Pop-Location
        }
        Write-Host ">>> Build thanh cong: $BackendDir\target\ROOT.war" -ForegroundColor Green
        break
    }

    default {
        # Action "run" hoac "debug"
        Write-Host ">>> [1/3] Kiem tra va giai phong port 8080..." -ForegroundColor Cyan
        $connections = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
        if ($connections) {
            Write-Host ">>> Phat hien process dang dung port 8080, dang dung process..." -ForegroundColor Yellow
            foreach ($conn in $connections) {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 1
        }

        Write-Host ">>> [2/3] Build file ROOT.war..." -ForegroundColor Cyan
        Push-Location $BackendDir
        try {
            cmd /c "mvnw.cmd clean package -DskipTests"
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Build Maven that bai!"
                exit $LASTEXITCODE
            }
        } finally {
            Pop-Location
        }

        $SourceWar = Join-Path $BackendDir "target\ROOT.war"
        $TargetWar = Join-Path $WebappsDir "ROOT.war"
        $TargetFolder = Join-Path $WebappsDir "ROOT"

        Write-Host ">>> [3/3] Deploy ROOT.war vao Tomcat..." -ForegroundColor Cyan
        # Xoa thu muc ROOT cu da giai nen neu co de Tomcat giai nen ban moi
        if (Test-Path $TargetFolder) {
            Remove-Item -Path $TargetFolder -Recurse -Force -ErrorAction SilentlyContinue
        }
        Copy-Item -Path $SourceWar -Destination $TargetWar -Force
        Write-Host ">>> Da sao chep ROOT.war vao: $TargetWar" -ForegroundColor Green

        # Tu dong mo trinh duyet sau 3 giay (khi Tomcat da san sang)
        Start-Job -ScriptBlock {
            Start-Sleep -Seconds 3
            Start-Process "http://localhost:8080"
        } | Out-Null

        if ($Action -eq "debug") {
            Write-Host "`n========================================================" -ForegroundColor Magenta
            Write-Host " KHOI DONG TOMCAT O CHE DO DEBUG (JPDA PORT: 8000)" -ForegroundColor Magenta
            Write-Host " URL: http://localhost:8080" -ForegroundColor Magenta
            Write-Host " Nhan Ctrl+C de dung server bat cu luc nao." -ForegroundColor Magenta
            Write-Host "========================================================`n" -ForegroundColor Magenta
            $env:JPDA_TRANSPORT = "dt_socket"
            $env:JPDA_ADDRESS = "8000"
            & $CatalinaBat jpda run
        } else {
            Write-Host "`n========================================================" -ForegroundColor Green
            Write-Host " KHOI DONG TOMCAT 10.1 (PORT: 8080)" -ForegroundColor Green
            Write-Host " URL: http://localhost:8080" -ForegroundColor Green
            Write-Host " Nhan Ctrl+C de dung server bat cu luc nao." -ForegroundColor Green
            Write-Host "========================================================`n" -ForegroundColor Green
            & $CatalinaBat run
        }
    }
}
