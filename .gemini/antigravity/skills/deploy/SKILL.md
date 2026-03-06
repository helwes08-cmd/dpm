---
name: deploy-hetzner
description: Como realizar o deploy da aplicação no servidor Hetzner
---

# Deploy Hetzner

Esta skill fornece instruções e scripts para realizar o deploy da aplicação Next.js no servidor Hetzner (`46.225.105.149`).

## Pré-requisitos

1.  **SSH Access**: Você deve ter o SSH configurado para o usuário `root` no servidor.
2.  **Docker**: O servidor já deve ter o Docker e Nginx configurados (conforme realizados nos passos anteriores).
3.  **Tar**: O comando `tar` deve estar disponível no seu sistema (nativo no Windows 10+ e Unix-like).

## Estrutura de Arquivos

Os scripts de deploy estão localizados em `.gemini/antigravity/skills/deploy/`:
- `deploy-hetzner.bat`: Script para CMD/Batch do Windows.
- `deploy-hetzner.ps1`: Script para PowerShell do Windows.

## Como Executar

### Utilizando PowerShell (Recomendado)

1.  Abra o PowerShell na raiz do projeto.
2.  Execute o comando:
    ```powershell
    .\.gemini\antigravity\skills\deploy\deploy-hetzner.ps1
    ```

### Utilizando CMD

1.  Abra o Prompt de Comando na raiz do projeto.
2.  Execute o comando:
    ```cmd
    .\.gemini\antigravity\skills\deploy\deploy-hetzner.bat
    ```

## O que o script faz?

1.  **Empacotamento**: Cria um arquivo `dpm-app.tar.gz` excluindo `node_modules`, `.next`, `.git` e arquivos `.env` locais.
2.  **Transferência**: Envia o arquivo para o servidor via `scp`.
3.  **Ambiente Remoto**:
    - Extrai os arquivos em `/root/dpm-app`.
    - Reconstrói a imagem Docker `dpm-app`.
    - Para e remove o container `dpm-web` antigo.
    - Sobe o novo container utilizando o arquivo `.env` que já existe no servidor em `/data/dpm/.env`.
4.  **Limpeza**: Remove o arquivo `.tar.gz` local após o envio.

> [!IMPORTANT]
> O script utiliza o arquivo `.env` localizado no servidor em `/data/dpm/.env`. Quaisquer novas variáveis de ambiente devem ser adicionadas manualmente nesse arquivo no servidor antes de realizar o deploy.
