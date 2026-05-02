import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'links.json');

function readLinks() {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeLinks(links) {
  fs.writeFileSync(filePath, JSON.stringify(links, null, 2), 'utf-8');
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(readLinks());
  }

  if (req.method === 'POST') {
    const { name, slug, dest, desc } = req.body;
    if (!name || !slug || !dest) {
      return res.status(400).json({ error: 'name, slug e dest são obrigatórios' });
    }
    const links = readLinks();
    if (links.find(l => l.slug === slug)) {
      return res.status(409).json({ error: 'Slug já existe' });
    }
    const newLink = { id: Date.now(), name, slug, dest, desc: desc || '', createdAt: new Date().toISOString() };
    links.unshift(newLink);
    writeLinks(links);
    return res.status(201).json(newLink);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    let links = readLinks();
    links = links.filter(l => l.id !== Number(id));
    writeLinks(links);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
