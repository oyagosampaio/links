import { Resend } from 'resend';
import { appUrl, appHost } from './stripe';
import { BRAND } from './brand';

let resend;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

function fromAddress() {
  return process.env.RESEND_FROM || 'Oryon Links <noreply@oryondigital.com>';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout({ title, preview, bodyHtml }) {
  const host = appHost();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#161616;border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08);">
              <img src="${BRAND.logo}" alt="${escapeHtml(BRAND.name)}" width="36" height="36" style="display:block;border-radius:8px;margin-bottom:10px;" />
              <div style="font-size:16px;font-weight:700;color:#f0f0f0;">${escapeHtml(BRAND.name)}</div>
              <div style="font-size:12px;color:#888;margin-top:4px;">${escapeHtml(host)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#f0f0f0;font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href, label) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#d4f24c;color:#0d0d0d;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px;margin:18px 0 8px;">${escapeHtml(label)}</a>`;
}

export async function sendMail({ to, subject, html, text }) {
  const client = getResend();
  if (!client) {
    const err = new Error('E-mail não configurado');
    err.status = 503;
    throw err;
  }
  const { error } = await client.emails.send({
    from: fromAddress(),
    to,
    subject,
    html,
    text,
  });
  if (error) {
    const err = new Error(error.message || 'Falha ao enviar e-mail');
    err.status = 502;
    throw err;
  }
}

export async function sendAccessEmail({ to, name, password }) {
  const loginUrl = `${appUrl()}/login`;
  const greeting = name ? `Olá, ${name}` : 'Olá';
  const passwordBlock = password
    ? `<p style="margin:16px 0 0;color:#888;">Use estes dados para entrar:</p>
       <p style="margin:8px 0 0;color:#f0f0f0;"><strong>E-mail:</strong> ${escapeHtml(to)}<br/><strong>Senha:</strong> ${escapeHtml(password)}</p>`
    : `<p style="margin:16px 0 0;color:#888;">Entre com o e-mail <strong style="color:#f0f0f0;">${escapeHtml(to)}</strong> e a senha da sua conta.</p>`;

  const html = layout({
    title: 'Seu acesso está liberado',
    preview: 'Seu painel de links já está disponível.',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:20px;font-weight:700;">Seu acesso está liberado</p>
      <p style="margin:0;color:#888;">${escapeHtml(greeting)}. Sua conta no Oryon Links já pode ser usada.</p>
      ${passwordBlock}
      ${button(loginUrl, 'Acessar painel')}
      <p style="margin:20px 0 0;font-size:12px;color:#555;">Se você não esperava este e-mail, pode ignorá-lo.</p>
    `,
  });

  const text = [
    'Seu acesso está liberado',
    `${greeting}. Sua conta no Oryon Links já pode ser usada.`,
    password ? `E-mail: ${to}\nSenha: ${password}` : `Entre com o e-mail ${to} e a senha da sua conta.`,
    `Acesse: ${loginUrl}`,
  ].join('\n\n');

  await sendMail({
    to,
    subject: 'Seu acesso ao Oryon Links está liberado',
    html,
    text,
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const html = layout({
    title: 'Redefinir senha',
    preview: 'Use o botão abaixo para criar uma nova senha.',
    bodyHtml: `
      <p style="margin:0 0 12px;font-size:20px;font-weight:700;">Redefinir senha</p>
      <p style="margin:0;color:#888;">Recebemos um pedido para redefinir a senha da sua conta. O link vale por 24 horas.</p>
      ${button(resetUrl, 'Criar nova senha')}
      <p style="margin:20px 0 0;font-size:12px;color:#555;">Se você não pediu isso, ignore este e-mail. Sua senha permanece a mesma.</p>
    `,
  });

  const text = [
    'Redefinir senha',
    'Recebemos um pedido para redefinir a senha da sua conta. O link vale por 24 horas.',
    `Criar nova senha: ${resetUrl}`,
    'Se você não pediu isso, ignore este e-mail.',
  ].join('\n\n');

  await sendMail({
    to,
    subject: 'Redefinir senha — Oryon Links',
    html,
    text,
  });
}

export async function sendAccessEmailSafe(payload) {
  try {
    await sendAccessEmail(payload);
    return true;
  } catch (error) {
    console.error('Falha ao enviar e-mail de acesso:', error);
    return false;
  }
}
