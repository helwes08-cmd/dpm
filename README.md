## Destrua sua playlist

Aplicativo web viral que gera um roast sarcástico da sua playlist usando:

- Next.js (App Router)
- Tailwind CSS
- Supabase (Postgres)
- OpenAI API

Homepage:

- **Título**: `Destrua sua playlist`
- **Subtítulo**: “Cole sua playlist favorita e submeta sua dignidade musical.”
- **Inputs**: URL de playlist do Spotify e/ou YouTube
- **Botão**: “DESTRUIR MINHA PLAYLIST”
- **Loading**: tela de carregamento de ~5s com mensagens rotativas em português
- **Resultado**: score (0–10), texto de roast e métricas:
  - Originalidade
  - Influência do algoritmo
  - Energia de término
  - Vergonha alheia
- **Sessão pública**: “Playlists recentemente destruídas”, alimentada pelo Supabase.

---

## 1. Configuração rápida

Dentro da pasta do projeto (`destrua-sua-playlist`):

```bash
npm install
npm run dev
```

Depois abra `http://localhost:3000` no navegador.

Antes de usar em produção, configure as variáveis de ambiente e o banco no Supabase (próximas seções).

---

## 2. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (ou copie de `.env.local.example`) com:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key_super_secreta
```

**Importante**:

- `SUPABASE_SERVICE_ROLE_KEY` é sensível e deve ficar **apenas no backend** (como aqui, em `.env.local`, que não é commitado por padrão).
- Nunca exponha a service role key no frontend ou em variáveis que começam com `NEXT_PUBLIC_`.

---

## 3. Tabela no Supabase

No painel do Supabase (SQL Editor), crie a tabela que armazena os resultados dos roasts:

```sql
create table if not exists public.playlist_roasts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  spotify_url text,
  youtube_url text,

  score numeric(4,1) not null,
  roast text not null,

  originalidade numeric(4,1),
  influencia_do_algoritmo numeric(4,1),
  energia_de_termino numeric(4,1),
  vergonha_alheia numeric(4,1)
);

create index if not exists playlist_roasts_created_at_idx
  on public.playlist_roasts (created_at desc);
```

Permissões recomendadas:

- Use a **service role key** no backend (já feito via `SUPABASE_SERVICE_ROLE_KEY`) para inserir e ler.
- Para exposição pública (caso crie uma API pública depois), use policies de leitura apenas.

---

## 4. Como funciona

- O frontend (`app/page.tsx`) é um Client Component com:
  - inputs para URLs de playlist
  - botão “DESTRUIR MINHA PLAYLIST”
  - animação de loading de 5 segundos com mensagens:
    - “Procurando personalidade...”
    - “Escutando sua playlist...”
    - “Calculando nível de vergonha musical...”
    - “Comparando com playlists genéricas...”
    - “Gerando roast musical...”
- Após o loading, o app chama:
  - `POST /api/roast` para gerar o roast via OpenAI e salvar no Supabase.
  - `GET /api/recent` para listar as últimas playlists destruídas.

Back-end:

- `app/api/roast/route.ts`
  - Valida URLs recebidas.
  - Chama OpenAI (via `lib/openai.ts`) pedindo um JSON com:
    - `score`
    - `roast`
    - `metrics` (originalidade, influência do algoritmo, energia de término, vergonha alheia)
  - Faz o insert no Supabase (via `lib/supabaseAdmin.ts`) na tabela `playlist_roasts`.
  - Retorna para o frontend o objeto salvo/gerado.

- `app/api/recent/route.ts`
  - Busca as últimas 10 linhas em `playlist_roasts`, ordenadas por `created_at desc`.
  - Mapeia para o formato exibido em “Playlists recentemente destruídas”.

---

## 5. Rodando em desenvolvimento

```bash
npm run dev
```

O app ficará disponível em `http://localhost:3000`.

Certifique-se de que:

- `OPENAI_API_KEY` está válida.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas.
- A tabela `playlist_roasts` foi criada.

Se o Supabase não estiver configurado, o app ainda funciona para gerar o roast, mas a seção de “Playlists recentemente destruídas” poderá ficar vazia ou não carregar.

