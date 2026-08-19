export const BRAND = {
  name: 'Oryon Links',
  logo: 'https://tgntvsndqfigrdkvhvzx.supabase.co/storage/v1/object/public/Logomarcas/5%20(2).png',
  favicon: 'https://tgntvsndqfigrdkvhvzx.supabase.co/storage/v1/object/public/Logomarcas/5%20(2).png',
  preview: 'https://tgntvsndqfigrdkvhvzx.supabase.co/storage/v1/object/public/Oryon%20Digital/Captura%20de%20tela%202026-08-19%20161939.png',
  description: 'Crie slugs únicos, redirecione para qualquer destino e gerencie seus links em um painel isolado.',
};

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://link.oryondigital.com').replace(/\/$/, '');
}
