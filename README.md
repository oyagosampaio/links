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

### Solução recomendada para produção:
Use o **Vercel KV** (banco Redis gratuito da própria Vercel):

1. No painel da Vercel: **Storage → Create → KV**
2. Instale: `npm install @vercel/kv`
3. Substitua as leituras/escritas do JSON pela API do KV

Exemplo:
```js
import { kv } from '@vercel/kv';
const links = await kv.get('links') || [];
await kv.set('links', links);
```

Prefere que eu já faça essa versão com Vercel KV? É só pedir!
# links
