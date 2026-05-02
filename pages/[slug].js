import fs from 'fs';
import path from 'path';

export async function getServerSideProps(context) {
  const { slug } = context.params;

  // /admin é reservado para o painel
  if (slug === 'admin') {
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
