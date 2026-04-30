import pkg from 'pg';
const { Client } = pkg;
import { pipeline } from '@xenova/transformers';

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

export async function embedText(text: string): Promise<number[]> {
  const model = await getExtractor();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export async function hybridSearch(query: string, dbUrl: string, topK: number = 5) {
  const embedding = await embedText(query);
  const embedStr = `[${embedding.join(',')}]`;

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    // 1. Vector search for chunks
    const vectorQuery = `
      SELECT n.id, n.title, c.content, (c.embedding <=> $1::vector) as distance
      FROM chunks c
      JOIN notes n ON n.id = c."noteId"
      ORDER BY distance ASC
      LIMIT $2
    `;

    // 2. Graph search
    const graphQuery = `
      WITH RECURSIVE traverse AS (
        SELECT id, label, type, "noteId", 0 as depth, '[]'::jsonb as path
        FROM graph_nodes
        ORDER BY embedding <=> $1::vector
        LIMIT 3

        UNION

        SELECT n.id, n.label, n.type, n."noteId", t.depth + 1,
               t.path || jsonb_build_object('node_label', n.label, 'relation', e.relation, 'direction', e.direction)
        FROM graph_edges e
        JOIN traverse t ON (e."sourceId" = t.id OR e."targetId" = t.id)
        JOIN graph_nodes n ON n.id = (CASE WHEN e."sourceId" = t.id THEN e."targetId" ELSE e."sourceId" END)
        WHERE t.depth < 2
      )
      SELECT DISTINCT ON (t."noteId") t."noteId", n.title, n.content, t.path
      FROM traverse t
      JOIN notes n ON n.id = t."noteId"
      WHERE t."noteId" IS NOT NULL
      LIMIT $2
    `;

    const [vectorRes, graphRes] = await Promise.all([
      client.query(vectorQuery, [embedStr, topK]),
      client.query(graphQuery, [embedStr, topK])
    ]);

    const merged = new Map<string, any>();

    // Process Vector Results
    for (const res of vectorRes.rows) {
      merged.set(res.id, {
        id: res.id,
        title: res.title,
        content: res.content,
        score: 1 - (res.distance || 0.5),
        source: 'vector',
        path: []
      });
    }

    // Process Graph Results & Fuse
    for (const res of graphRes.rows) {
      const nid = res.noteId;
      if (merged.has(nid)) {
        const existing = merged.get(nid);
        existing.source = 'both';
        existing.score += 0.1; // Boost for dual verification
        existing.path = res.path || [];
      } else {
        merged.set(nid, {
          id: nid,
          title: res.title,
          content: res.content,
          score: 0.8, // Default graph confidence
          source: 'graph',
          path: res.path || []
        });
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } finally {
    await client.end();
  }
}
