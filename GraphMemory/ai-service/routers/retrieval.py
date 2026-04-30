from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter()

# Simple in-memory trace cache for visualization
last_traces: Dict[str, Dict[str, Any]] = {}

@router.get("/last/{session_id}")
async def get_last_trace(session_id: str):
    return last_traces.get(session_id, {
        "vector_results": [],
        "graph_results": [],
        "merged_results": []
    })

def store_trace(session_id: str, trace: Dict[str, Any]):
    last_traces[session_id] = trace
