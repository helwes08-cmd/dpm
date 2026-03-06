@echo off
set SERVER_IP=46.225.105.149
set SERVER_USER=root
set REMOTE_PATH=/root
set APP_PATH=/root/dpm-app
set ENV_FILE=/data/dpm/.env

if not exist package.json (
    echo Erro: Execute este script a partir da raiz do projeto!
    pause
    exit /b
)


echo [1/4] Criando pacote de deploy...
tar --exclude="node_modules" --exclude=".next" --exclude=".git" --exclude=".env*" -czf dpm-app.tar.gz .

echo [2/4] Enviando para o servidor (%SERVER_IP%)...
scp dpm-app.tar.gz %SERVER_USER%@%SERVER_IP%:%REMOTE_PATH%/dpm-app.tar.gz

echo [3/4] Extraindo e reconstruindo imagem Docker no servidor...
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %APP_PATH% && tar -xzf %REMOTE_PATH%/dpm-app.tar.gz -C %APP_PATH% && cd %APP_PATH% && docker build -t dpm-app . && docker stop dpm-web || true && docker rm dpm-web || true && docker run -d --name dpm-web --restart always -p 3001:3000 --env-file %ENV_FILE% dpm-app"

echo [4/4] Limpando arquivos locais...
del dpm-app.tar.gz

echo Deploy concluido com sucesso!
pause
