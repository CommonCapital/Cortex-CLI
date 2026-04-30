from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import QueryRequest
from services.hybrid_retriever import retrieve
from services.rag_service import build_context, build_prompt, stream_answer
from routers.retrieval import store_trace
import json

router = APIRouter()

@router.post("/query")
async def rag_query_endpoint(req: QueryRequest):
    results = await retrieve(req.query, session_id=req.session_id, top_k=req.top_k)
    context = build_context(results)
    
    history = []
    prompt = build_prompt(req.query, context, history)
    
    async def event_generator():
        # Store trace for visualization
        session_id = req.session_id or "default"
        trace_data = {
            "vector_results": [r for r in results if r["source"] in ("rag", "both")],
            "graph_results": [r for r in results if r["source"] in ("graph", "both")],
            "merged_results": results
        }
        store_trace(session_id, trace_data)
        
        sources = [{"note_id": r["note_id"], "source": r["source"], "score": r["score"], "path": r.get("path", [])} for r in results]
        yield f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n"
        
        async for chunk in stream_answer(prompt):
            yield f"data: {json.dumps({'type': 'chunk', 'data': chunk})}\n\n"
            
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
