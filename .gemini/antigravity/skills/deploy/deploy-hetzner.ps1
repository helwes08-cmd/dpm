$ServerIp = "46.225.105.149"
$ServerUser = "root"
$RemotePath = "/root"
$AppPath = "/root/dpm-app"
$EnvFile = "/data/dpm/.env"

if (!(Test-Path "package.json")) {
    Write-Host "Erro: Execute este script a partir da raiz do projeto!" -ForegroundColor Red
    exit
}


Write-Host "[1/4] Criando pacote de deploy..." -ForegroundColor Cyan
tar --exclude="node_modules" --exclude=".next" --exclude=".git" --exclude=".env*" -czf dpm-app.tar.gz .

Write-Host "[2/4] Enviando para o servidor ($ServerIp)..." -ForegroundColor Cyan
scp dpm-app.tar.gz "$($ServerUser)@$($ServerIp):$RemotePath/dpm-app.tar.gz"

Write-Host "[3/4] Extraindo e reconstruindo imagem Docker no servidor..." -ForegroundColor Cyan
$RemoteCommand = "mkdir -p $AppPath && tar -xzf $RemotePath/dpm-app.tar.gz -C $AppPath && cd $AppPath && docker build -t dpm-app . && docker stop dpm-web || true && docker rm dpm-web || true && docker run -d --name dpm-web --restart always -p 3001:3000 --env-file $EnvFile dpm-app"
ssh "$($ServerUser)@$($ServerIp)" $RemoteCommand

Write-Host "[4/4] Limpando arquivos locais..." -ForegroundColor Cyan
Remove-Item dpm-app.tar.gz

Write-Host "Deploy concluído com sucesso!" -ForegroundColor Green
Read-Host "Pressione Enter para sair"
