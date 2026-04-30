from fastapi import APIRouter, BackgroundTasks
from models.schemas import EmbedNoteRequest
from services.embedding_service import embed_text
from services.chunker import chunk_note
from services.graph_service import extract_entities, upsert_graph
from db.postgres import get_db
import json

router = APIRouter()

async def process_note_embedding(note_id: str, title: str, content: str):
    try:
        full_text = f"{title}\n\n{content}"
        full_embed = embed_text(full_text)
        
        async with get_db() as conn:
            await conn.execute('UPDATE notes SET embedding = $1::vector WHERE id = $2', json.dumps(full_embed), note_id)
            
            await conn.execute('DELETE FROM chunks WHERE "noteId" = $1', note_id)
            chunks = chunk_note(content)
            for i, chunk in enumerate(chunks):
                chunk_text = f"{title} - Part {i}\n\n{chunk}"
                chunk_embed = embed_text(chunk_text)
                await conn.execute('''
                    INSERT INTO chunks ("noteId", content, "chunkIndex", embedding)
                    VALUES ($1, $2, $3, $4::vector)
                ''', note_id, chunk, i, json.dumps(chunk_embed))
                
        extract_res = await extract_entities(full_text)
        if extract_res.nodes:
            node_labels = [n.label for n in extract_res.nodes]
            embeddings_map = {}
            for label in node_labels:
                embeddings_map[label] = embed_text(label)
                
            await upsert_graph(note_id, extract_res.nodes, extract_res.edges, embeddings_map)
    except Exception as e:
        print(f"Error processing embedding for {note_id}: {e}")

@router.post("/note")
async def embed_note_endpoint(req: EmbedNoteRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_note_embedding, req.id, req.title, req.content)
    return {"status": "accepted", "note_id": req.id}
