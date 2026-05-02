import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin, rowToLink } from '../lib/supabaseAdmin';

export async function getServerSideProps(context) {
  const { slug } = context.params;

  if (slug === 'admin') {
    return { notFound: true };
  }

  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from('links')
      .select('id,name,slug,dest,desc,created_at')
      .eq('slug', slug)
      .maybeSingle();
    if (error) {
      console.error('Supabase get link:', error);
      return { notFound: true };
    }
    const link = rowToLink(data);
    if (link) {
      return {
        redirect: {
          destination: link.dest,
          permanent: false,
        },
      };
    }
    return { notFound: true };
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'links.json');
    const links = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const link = links.find(l => l.slug === slug);

    if (link) {
      return {
        redirect: {
          destination: link.dest,
          permanent: false,
        },
      };
    }
  } catch {}

  return { notFound: true };
}

export default function Redirect() {
  return null;
}
