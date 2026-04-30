from fastapi import APIRouter, BackgroundTasks
from db.postgres import get_db
import json
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class ProjectRequest(BaseModel):
    method: str = "umap"
    n_neighbors: int = 15

@router.post("/project")
async def project_vectors(req: ProjectRequest):
    async with get_db() as conn:
        rows = await conn.fetch('SELECT id, title, embedding::text as embed_str FROM notes WHERE embedding IS NOT NULL')
    
    if not rows:
        return []
        
    import numpy as np
    
    ids = []
    titles = []
    embeddings = []
    
    for r in rows:
        ids.append(str(r['id']))
        titles.append(r['title'])
        embed_list = json.loads(r['embed_str'])
        embeddings.append(embed_list)
        
    X = np.array(embeddings)
    
    if req.method == "umap":
        try:
            import umap
            reducer = umap.UMAP(n_neighbors=min(req.n_neighbors, len(X)-1) if len(X) > req.n_neighbors else 2, random_state=42)
            proj = reducer.fit_transform(X)
        except Exception as e:
            from sklearn.manifold import TSNE
            reducer = TSNE(n_components=2, perplexity=min(30, len(X)-1), random_state=42)
            proj = reducer.fit_transform(X)
    else:
        from sklearn.manifold import TSNE
        reducer = TSNE(n_components=2, perplexity=min(30, len(X)-1), random_state=42)
        proj = reducer.fit_transform(X)
        
    result = []
    for i in range(len(proj)):
        result.append({
            "id": ids[i],
            "title": titles[i],
            "x": float(proj[i][0]),
            "y": float(proj[i][1]),
            "tags": ["General"] # could be pulled from graph or note properties
        })
        
    return result

@router.post("/reindex-all")
async def reindex_all(background_tasks: BackgroundTasks):
    from routers.embed import process_note_embedding
    async def run_reindex():
        async with get_db() as conn:
            notes = await conn.fetch("SELECT id, title, content FROM notes")
        for note in notes:
            await process_note_embedding(str(note['id']), note['title'] or "", note['content'] or "")
            
    background_tasks.add_task(run_reindex)
    return {"status": "started"}
