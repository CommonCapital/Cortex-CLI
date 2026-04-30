import asyncio
from typing import List, Dict, Any
from models.schemas import ChunkResult, NoteResult
from services.vector_store import vector_search, note_search
from services.graph_service import graph_search
from services.embedding_service import embed_text

async def retrieve(query: str, session_id: str = None, top_k: int = 12) -> List[Dict[str, Any]]:
    embedding = embed_text(query)

    vector_results, graph_results = await asyncio.gather(
        vector_search(embedding, top_k),
        graph_search(embedding, hops=2)
    )

    merged = {}
    
    for res in vector_results:
        nid = res.note_id
        if nid not in merged:
            merged[nid] = {"note_id": nid, "content": res.content, "score": res.score, "source": "rag", "path": []}
        else:
            merged[nid]["content"] += "\n" + res.content
            if res.score > merged[nid]["score"]:
                merged[nid]["score"] = res.score
                
    for res in graph_results:
        nid = res.id
        if nid in merged:
            merged[nid]["source"] = "both"
            merged[nid]["score"] += 0.1
            merged[nid]["content"] = res.content
            merged[nid]["path"] = res.path or []
        else:
            merged[nid] = {"note_id": nid, "content": res.content, "score": res.score, "source": "graph", "path": res.path or []}

    ranked = sorted(merged.values(), key=lambda x: x["score"], reverse=True)
    return ranked[:top_k]
