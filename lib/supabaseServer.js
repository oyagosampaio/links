import { createServerClient, serializeCookieHeader } from '@supabase/ssr';

export function createPagesServerClient({ req, res }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return Object.keys(req.cookies || {}).map((name) => ({
          name,
          value: req.cookies[name] || '',
        }));
      },
      setAll(cookiesToSet) {
        res.setHeader(
          'Set-Cookie',
          cookiesToSet.map(({ name, value, options }) =>
            serializeCookieHeader(name, value, options)
          )
        );
      },
    },
  });
}
