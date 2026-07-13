@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CicloPag - Enviar para GitHub

set "REPO_URL=https://github.com/wandersonmonteiro931-byte/ciclopag.git"
set "BRANCH=main"
set "PROJECT_DIR="

echo.
echo ============================================================
echo       CICLOPAG - ENVIO AUTOMATICO PARA O GITHUB
echo ============================================================
echo.

rem Procura automaticamente a pasta do projeto.
if exist "%~dp0package.json" set "PROJECT_DIR=%~dp0"
if not defined PROJECT_DIR if exist "%~dp0CicloPag_Base_Inicial\package.json" set "PROJECT_DIR=%~dp0CicloPag_Base_Inicial"
if not defined PROJECT_DIR if exist "%~dp0ciclopag\package.json" set "PROJECT_DIR=%~dp0ciclopag"

if not defined PROJECT_DIR (
    for /d %%D in ("%~dp0*") do (
        if not defined PROJECT_DIR if exist "%%~fD\package.json" set "PROJECT_DIR=%%~fD"
    )
)

if not defined PROJECT_DIR (
    echo Nao encontrei automaticamente a pasta que contem package.json.
    echo.
    set /p "PROJECT_DIR=Digite ou cole o caminho completo da pasta do CicloPag: "
    set "PROJECT_DIR=!PROJECT_DIR:"=!"
)

if not exist "!PROJECT_DIR!\package.json" (
    echo.
    echo [ERRO] O arquivo package.json nao foi encontrado em:
    echo !PROJECT_DIR!
    echo.
    echo Coloque este BAT dentro da pasta do projeto ou mantenha-o
    echo em Downloads ao lado da pasta CicloPag_Base_Inicial.
    echo.
    pause
    exit /b 1
)

pushd "!PROJECT_DIR!" || (
    echo [ERRO] Nao foi possivel abrir a pasta do projeto.
    pause
    exit /b 1
)

echo Pasta encontrada:
echo !CD!
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo [ERRO] O Git nao esta instalado ou nao esta no PATH.
    echo Instale em: https://git-scm.com/download/win
    echo.
    pause
    popd
    exit /b 1
)

rem Corrige um nome incorreto que pode ter sido enviado antes.
if exist "arquivo package-lock.json" (
    if not exist "package-lock.json" ren "arquivo package-lock.json" "package-lock.json"
)

rem Garante protecao de arquivos locais e segredos.
if not exist ".gitignore" (
    >".gitignore" (
        echo node_modules/
        echo dist/
        echo .env
        echo .env.local
        echo .env.production
        echo .env.development
        echo *.log
    )
) else (
    findstr /x /c:"node_modules/" ".gitignore" >nul 2>&1 || echo node_modules/>>".gitignore"
    findstr /x /c:"dist/" ".gitignore" >nul 2>&1 || echo dist/>>".gitignore"
    findstr /x /c:".env" ".gitignore" >nul 2>&1 || echo .env>>".gitignore"
    findstr /x /c:".env.local" ".gitignore" >nul 2>&1 || echo .env.local>>".gitignore"
    findstr /x /c:".env.production" ".gitignore" >nul 2>&1 || echo .env.production>>".gitignore"
    findstr /x /c:".env.development" ".gitignore" >nul 2>&1 || echo .env.development>>".gitignore"
)

rem Configura nome e email do Git se ainda nao estiverem definidos.
for /f "delims=" %%N in ('git config --global user.name 2^>nul') do set "GIT_NAME=%%N"
for /f "delims=" %%E in ('git config --global user.email 2^>nul') do set "GIT_EMAIL=%%E"

if not defined GIT_NAME (
    set /p "GIT_NAME=Digite seu nome para o Git: "
    git config --global user.name "!GIT_NAME!"
)

if not defined GIT_EMAIL (
    set /p "GIT_EMAIL=Digite o email usado no GitHub: "
    git config --global user.email "!GIT_EMAIL!"
)

echo [1/6] Preparando repositorio...

if not exist ".git" (
    git init
    if errorlevel 1 goto :falha

    git remote add origin "%REPO_URL%"
    if errorlevel 1 goto :falha

    git fetch origin "%BRANCH%"
    if errorlevel 1 goto :falha

    git reset --mixed "origin/%BRANCH%"
    if errorlevel 1 goto :falha

    git branch -M "%BRANCH%"
) else (
    git remote get-url origin >nul 2>&1
    if errorlevel 1 (
        git remote add origin "%REPO_URL%"
    ) else (
        git remote set-url origin "%REPO_URL%"
    )
    git branch -M "%BRANCH%"
)

echo [2/6] Preparando alteracoes...
git add -A

git reset -- ".env" ".env.local" ".env.production" ".env.development" >nul 2>&1

git diff --cached --quiet
if errorlevel 1 (
    for /f "delims=" %%D in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "DATA_HORA=%%D"
    set "MENSAGEM=Atualizacao CicloPag !DATA_HORA!"
    if not "%~1"=="" set "MENSAGEM=%~1"

    echo [3/6] Criando commit...
    git commit -m "!MENSAGEM!"
    if errorlevel 1 goto :falha
) else (
    echo [3/6] Nenhuma alteracao local nova para criar commit.
)

echo [4/6] Sincronizando com o GitHub...
git pull --rebase origin "%BRANCH%"
if errorlevel 1 goto :conflito

echo [5/6] Enviando para o GitHub...
git push -u origin "%BRANCH%"
if errorlevel 1 goto :falha

echo [6/6] Concluido.
echo.
echo ============================================================
echo [SUCESSO] CICLOPAG ENVIADO PARA O GITHUB.
echo A CLOUDFLARE DEVE INICIAR O DEPLOY AUTOMATICAMENTE.
echo ============================================================
echo.
popd
pause
exit /b 0

:conflito
echo.
echo ============================================================
echo [ERRO] O Git encontrou conflito ao sincronizar.
echo Nenhum envio foi concluido.
echo.
echo Execute estes comandos dentro da pasta do projeto:
echo   git rebase --abort
echo.
echo Depois envie uma captura da tela para corrigirmos.
echo ============================================================
echo.
popd
pause
exit /b 1

:falha
echo.
echo ============================================================
echo [ERRO] O envio nao foi concluido.
echo Confira a mensagem mostrada acima.
echo ============================================================
echo.
popd
pause
exit /b 1
