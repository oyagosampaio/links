# Oryon Links — Gerenciador de Links

## Deploy na Vercel

### 1. Instale a Vercel CLI
```bash
npm i -g vercel
```

### 2. Faça login
```bash
vercel login
```

### 3. Deploy
```bash
vercel --prod
```

### 4. Configure o domínio
No painel da Vercel:
- Vá em **Settings → Domains**
- Adicione `link.oryondigital.com`
- Aponte o DNS do seu domínio para a Vercel (eles vão te dar as instruções)

### 5. Acesse o painel
```
https://link.oryondigital.com/admin
```

---

## Como usar

1. Acesse `/admin`
2. Preencha nome, slug e destino
3. Clique em **Criar Link**
4. Compartilhe `link.oryondigital.com/seu-slug`

---

## ⚠️ Atenção sobre o JSON

A Vercel é **serverless** — o arquivo `data/links.json` funciona em desenvolvimento local,
mas em produção na Vercel os arquivos escritos em runtime não persistem entre deploys.

### Produção: Supabase

1. Crie a tabela `public.links` no SQL Editor do Supabase (colunas: `id`, `name`, `slug`, `dest`, `desc`, `created_at`).
2. Na Vercel: **Settings → Environment Variables**:
   - `SUPABASE_URL` — URL do projeto (ex.: `https://SEU_REF.supabase.co`, **sem** `/rest/v1`)
   - `SUPABASE_SERVICE_ROLE_KEY` — chave **service_role** (só servidor; nunca no front nem no Git)
3. Novo deploy.

Localmente: copie `.env.example` para `.env.local` e preencha.

A API e o redirect em `[slug].js` usam Supabase quando essas variáveis existem; caso contrário, usam `data/links.json`.
# links
