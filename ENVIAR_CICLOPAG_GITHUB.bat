@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CicloPag - Enviar para GitHub

set "REPO_URL=https://github.com/wandersonmonteiro931-byte/ciclopag.git"
set "BRANCH=main"
set "PROJECT_DIR=%~dp0"

pushd "%PROJECT_DIR%" || (
    echo [ERRO] Nao foi possivel abrir a pasta do projeto.
    pause
    exit /b 1
)

if not exist "package.json" (
    echo.
    echo [ERRO] package.json nao encontrado.
    echo Extraia o ZIP completo antes de executar este BAT.
    echo.
    popd
    pause
    exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] O Git nao esta instalado ou nao esta no PATH.
    echo Instale em: https://git-scm.com/download/win
    echo.
    popd
    pause
    exit /b 1
)

echo.
echo ============================================================
echo       CICLOPAG - ENVIO AUTOMATICO PARA O GITHUB
echo ============================================================
echo.

echo [1/8] Corrigindo configuracao publica do npm...
> ".npmrc" (
    echo registry=https://registry.npmjs.org/
    echo audit=false
    echo fund=false
    echo progress=false
    echo prefer-online=true
)

if exist "package-lock.json" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$p='package-lock.json';" ^
      "$c=[IO.File]::ReadAllText($p);" ^
      "$c=$c.Replace('https://packages.applied-caas-gateway1.internal.api.openai.org/artifactory/api/npm/npm-public/','https://registry.npmjs.org/');" ^
      "$c=$c.Replace('https://packages.applied-caas-gateway.internal.api.openai.org/artifactory/api/npm/npm-public/','https://registry.npmjs.org/');" ^
      "[IO.File]::WriteAllText($p,$c,(New-Object Text.UTF8Encoding($false)))"
    if errorlevel 1 goto :falha
)

if not exist ".gitignore" (
    > ".gitignore" (
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

echo [2/8] Verificando identificacao do Git...
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

echo [3/8] Preparando repositorio Git...
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

echo [4/8] Preparando alteracoes locais...
git add -A
git reset -- ".env" ".env.local" ".env.production" ".env.development" >nul 2>&1

git diff --cached --quiet
if errorlevel 1 (
    for /f "delims=" %%D in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "DATA_HORA=%%D"
    echo [5/8] Criando commit local...
    git commit -m "Correcao CicloPag !DATA_HORA!"
    if errorlevel 1 goto :falha
) else (
    echo [5/8] Nenhuma alteracao local nova para commit.
)

echo [6/8] Sincronizando com o GitHub...
git pull --rebase origin "%BRANCH%"
if errorlevel 1 goto :conflito

echo [7/8] Enviando para o GitHub...
git push -u origin "%BRANCH%"
if errorlevel 1 goto :falha

echo [8/8] Concluido.
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
echo [ERRO] O Git encontrou conflito durante o rebase.
echo.
echo Execute dentro desta pasta:
echo   git rebase --abort
echo.
echo Depois envie uma captura da tela.
echo ============================================================
echo.
popd
pause
exit /b 1

:falha
echo.
echo ============================================================
echo [ERRO] O processo nao foi concluido.
echo Confira a mensagem mostrada acima.
echo ============================================================
echo.
popd
pause
exit /b 1
