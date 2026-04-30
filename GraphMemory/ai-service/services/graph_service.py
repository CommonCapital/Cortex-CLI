import json
import os
import asyncio
from typing import List, Dict, Any
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from models.schemas import GraphNodeBase, GraphEdgeBase, ExtractResponse, NoteResult
from db.postgres import get_db

AI_PROVIDER = os.getenv("AI_PROVIDER", "anthropic").lower()

def get_llm():
    if AI_PROVIDER == "anthropic":
        return ChatAnthropic(model="claude-3-haiku-20240307", max_tokens=1024, temperature=0.1)
    else:
        return ChatOpenAI(model="gpt-4o-mini", max_tokens=1024, temperature=0.1)

async def extract_entities(text: str) -> ExtractResponse:
    if not text.strip():
        return ExtractResponse(nodes=[], edges=[])

    llm = get_llm()
    prompt = """
    You are a knowledge graph extractor. Given a text, extract ALL named entities and ALL relationships between them.
    
    For each relationship, determine:
    - The most specific relation type from this taxonomy:
      [is_a, part_of, type_of, causes, enables, requires, works_at, created_by, knows, founded, precedes, succeeded_by, similar_to, broader_than, narrower_than, derived_from, references, related_to]
    - Direction: which entity is source, which is target ("out", "in", "bidirectional")
    - Confidence: 0.0-1.0 how certain you are about this relation
    
    Also extract INTER-NODE relations even when both entities are already known.
    
    Return ONLY valid JSON:
    {
      "nodes": [
        { "label": "string", "type": "string", "properties": {} }
      ],
      "edges": [
        {
          "source": "string",
          "target": "string",
          "relation": "string",
          "direction": "out",
          "confidence": 1.0
        }
      ]
    }

    Text:
    {text}
    """
    try:
        response = await llm.ainvoke(prompt.format(text=text))
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        data = json.loads(content)
        nodes = [GraphNodeBase(**n) for n in data.get("nodes", [])]
        edges = [GraphEdgeBase(**e) for e in data.get("edges", [])]
        return ExtractResponse(nodes=nodes, edges=edges)
    except Exception as e:
        print(f"Extraction error: {e}")
        return ExtractResponse(nodes=[], edges=[])

async def upsert_graph(note_id: str, nodes: List[GraphNodeBase], edges: List[GraphEdgeBase], embeddings_map: Dict[str, List[float]]):
    async with get_db() as conn:
        node_id_map = {}
        for n in nodes:
            label = n.label.lower()
            existing = await conn.fetchrow("SELECT id FROM graph_nodes WHERE LOWER(label) = $1", label)
            if existing:
                node_id_db = existing['id']
                await conn.execute('UPDATE graph_nodes SET "noteId" = $1 WHERE id = $2', note_id, node_id_db)
            else:
                embedding = embeddings_map.get(n.label, None)
                embed_str = json.dumps(embedding) if embedding else None
                if embed_str:
                    res = await conn.fetchrow('''
                        INSERT INTO graph_nodes (label, type, "noteId", properties, embedding)
                        VALUES ($1, $2, $3, $4, $5::vector)
                        RETURNING id
                    ''', n.label, n.type, note_id, json.dumps(n.properties), embed_str)
                else:
                    res = await conn.fetchrow('''
                        INSERT INTO graph_nodes (label, type, "noteId", properties)
                        VALUES ($1, $2, $3, $4)
                        RETURNING id
                    ''', n.label, n.type, note_id, json.dumps(n.properties))
                node_id_db = res['id']
            node_id_map[label] = node_id_db

        for e in edges:
            src_id = node_id_map.get(e.source.lower())
            tgt_id = node_id_map.get(e.target.lower())
            if src_id and tgt_id:
                existing_edge = await conn.fetchrow('''
                    SELECT id FROM graph_edges WHERE "sourceId" = $1 AND "targetId" = $2 AND relation = $3
                ''', src_id, tgt_id, e.relation)
                if not existing_edge:
                    await conn.execute('''
                        INSERT INTO graph_edges ("sourceId", "targetId", relation, weight, direction, confidence, "extractedBy", "noteId")
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ''', src_id, tgt_id, e.relation, e.weight, e.direction, e.confidence, "llm", note_id)

async def bfs_traverse(start_node_ids: List[str], hops: int = 2, relation_filter: List[str] = None, min_confidence: float = 0.5, min_weight: float = 0.3):
    async with get_db() as conn:
        query = '''
            WITH RECURSIVE graph_bfs AS (
              SELECT id, label, type, "noteId", 0 as depth
              FROM graph_nodes
              WHERE id = ANY($1::uuid[])
            
              UNION ALL
            
              SELECT gn.id, gn.label, gn.type, gn."noteId", gb.depth + 1
              FROM graph_bfs gb
              JOIN graph_edges ge ON (ge."sourceId" = gb.id OR ge."targetId" = gb.id)
              JOIN graph_nodes gn ON (
                gn.id = CASE WHEN ge."sourceId" = gb.id
                             THEN ge."targetId"
                             ELSE ge."sourceId" END
              )
              WHERE gb.depth < $2
                AND ($3::text[] IS NULL OR ge.relation = ANY($3::text[]))
                AND ge.confidence >= $4
                AND ge.weight >= $5
            )
            SELECT DISTINCT id, label, type, "noteId" FROM graph_bfs
        '''
        res = await conn.fetch(query, start_node_ids, hops, relation_filter, min_confidence, min_weight)
        return [dict(r) for r in res]

async def graph_search(embedding: List[float], hops: int = 2) -> List[NoteResult]:
    embed_str = json.dumps(embedding)
    async with get_db() as conn:
        start_nodes = await conn.fetch('''
            SELECT id, label FROM graph_nodes
            ORDER BY embedding <=> $1::vector
            LIMIT 3
        ''', embed_str)

        if not start_nodes:
            return []

        start_ids = [n['id'] for n in start_nodes]

        query = '''
            WITH RECURSIVE traverse AS (
                SELECT id, label, type, "noteId", 0 as depth, 
                       '[]'::jsonb as path
                FROM graph_nodes
                WHERE id = ANY($1::uuid[])

                UNION

                SELECT n.id, n.label, n.type, n."noteId", t.depth + 1,
                       t.path || jsonb_build_object('node_label', n.label, 'relation', e.relation, 'direction', e.direction)
                FROM graph_edges e
                JOIN traverse t ON (e."sourceId" = t.id OR e."targetId" = t.id)
                JOIN graph_nodes n ON n.id = (CASE WHEN e."sourceId" = t.id THEN e."targetId" ELSE e."sourceId" END)
                WHERE t.depth < $2
            )
            SELECT DISTINCT ON (t."noteId") t."noteId", n.title, n.content, t.path
            FROM traverse t
            JOIN notes n ON n.id = t."noteId"
            WHERE t."noteId" IS NOT NULL
            LIMIT 10
        '''
        results = await conn.fetch(query, start_ids, hops)

        return [NoteResult(id=str(r['noteId']), title=r['title'], content=r['content'], score=0.8, source="graph", path=json.loads(r['path'])) for r in results]
