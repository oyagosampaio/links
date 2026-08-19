# Oryon Links — SaaS multi-tenant

Gerenciador de links com contas isoladas, Stripe (R$ 9,90/mês) e painel de administrador.

## O que mudou

- **Assinantes** entram em `/app` depois de pagar (ou receberem acesso manual).
- **Admin (você)** entra em `/admin`: cria links e gerencia assinantes/cortesias.
- Cada conta só vê e edita os próprios links.
- **Slug único na plataforma inteira** — ninguém pode repetir um slug, nem o mesmo usuário.

## 1. Supabase

1. Rode `supabase/schema.sql` no SQL Editor.
2. Em **Authentication → Providers → Email**, você pode desligar “Confirm email” (o cadastro já confirma o usuário pelo servidor).
3. Crie a conta admin (cadastro no site com o mesmo e-mail de `ADMIN_EMAIL`) **ou** rode:

```sql
update public.tenants
set role = 'admin', plan_status = 'active', access_type = 'manual'
where lower(email) = lower('seu-email@dominio.com');
```

4. Se ainda existirem links antigos sem `tenant_id`:

```sql
update public.links
set tenant_id = (select id from public.tenants where role = 'admin' limit 1)
where tenant_id is null;
```

## 2. Stripe

1. Crie um produto recorrente **mensal** de **BRL 9,90**.
2. Copie o `price_...` para `STRIPE_PRICE_ID`.
3. Webhook apontando para `https://SEU_DOMINIO/api/stripe/webhook` com os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Em **Billing → Customer portal**, ative o portal (cancelamento / cartão).

Localmente:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use o `whsec_...` gerado em `STRIPE_WEBHOOK_SECRET`.

## 3. Variáveis de ambiente

Copie `.env.example` para `.env.local` (e as mesmas chaves na Vercel):

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` (só servidor) |
| `ADMIN_EMAIL` | Seu e-mail de dono |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook |
| `STRIPE_PRICE_ID` | Preço mensal 9,90 |
| `NEXT_PUBLIC_APP_URL` | `https://link.oryondigital.com` |
| `NEXT_PUBLIC_APP_HOST` | `link.oryondigital.com` |
| `RESEND_API_KEY` | API Key do Resend |
| `RESEND_FROM` | Remetente verificado, ex. `Oryon Links <noreply@oryondigital.com>` |

No Resend: verifique o domínio `oryondigital.com` e use um remetente desse domínio. Os e-mails de acesso (assinatura liberada / cortesia) e de “esqueci a senha” saem por aí.

Nunca commite `service_role` nem chaves Stripe.

## 4. Deploy na Vercel

```bash
npm i
vercel --prod
```

Domínio: **Settings → Domains** → `link.oryondigital.com`.

## Fluxos

- Visitante → `/signup` → Stripe Checkout → webhook libera `/app`
- Você → `/admin` → aba **Links** (seus links) e **Assinantes** (lista + cortesias/testers/manuais)
- Público → `https://link.oryondigital.com/slug` redireciona ao destino

Acesso manual no admin: informe e-mail, senha inicial (se for conta nova), tipo (cortesia, tester, assinante, manual) e validade opcional.
