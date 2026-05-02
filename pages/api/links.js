import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin, rowToLink } from '../../lib/supabaseAdmin';

const filePath = path.join(process.cwd(), 'data', 'links.json');

async function readLinksFromFile() {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function readLinks() {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from('links')
      .select('id,name,slug,dest,desc,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToLink);
  }
  return readLinksFromFile();
}

async function writeLinksFile(links) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(links, null, 2), 'utf-8');
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === 'GET') {
      return res.status(200).json(await readLinks());
    }

    if (req.method === 'POST') {
      const { name, slug, dest, desc } = req.body;
      if (!name || !slug || !dest) {
        return res.status(400).json({ error: 'name, slug e dest são obrigatórios' });
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('links')
          .insert({ name, slug, dest, desc: desc || '' })
          .select('id,name,slug,dest,desc,created_at')
          .single();
        if (error) {
          if (error.code === '23505') {
            return res.status(409).json({ error: 'Slug já existe' });
          }
          throw error;
        }
        return res.status(201).json(rowToLink(data));
      }

      const links = await readLinksFromFile();
      if (links.find(l => l.slug === slug)) {
        return res.status(409).json({ error: 'Slug já existe' });
      }
      const newLink = {
        id: Date.now(),
        name,
        slug,
        dest,
        desc: desc || '',
        createdAt: new Date().toISOString(),
      };
      links.unshift(newLink);
      await writeLinksFile(links);
      return res.status(201).json(newLink);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (supabase) {
        const { error } = await supabase.from('links').delete().eq('id', Number(id));
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }
      let links = await readLinksFromFile();
      links = links.filter(l => l.id !== Number(id));
      await writeLinksFile(links);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (error) {
    console.error('Erro em /api/links:', error);
    return res.status(500).json({
      error: 'Erro interno ao salvar links',
      details: error instanceof Error ? error.message : 'unknown_error',
    });
  }
}
