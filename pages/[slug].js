import { getSupabaseAdmin, rowToLink } from '../lib/supabaseAdmin';

export async function getServerSideProps(context) {
  const { slug } = context.params;

  const supabase = getSupabaseAdmin();
  if (!supabase) return { notFound: true };

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

export default function Redirect() {
  return null;
}
