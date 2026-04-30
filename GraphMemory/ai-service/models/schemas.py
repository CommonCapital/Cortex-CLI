from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class NoteCreate(BaseModel):
    id: str
    content: str
    title: str

class EmbedNoteRequest(BaseModel):
    id: str
    content: str
    title: str

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    top_k: int = 10

class ExtractRequest(BaseModel):
    text: str

class GraphNodeBase(BaseModel):
    label: str
    type: str = "concept"
    properties: Dict[str, Any] = {}

class GraphEdgeBase(BaseModel):
    source: str
    target: str
    relation: str
    direction: str = "out"
    confidence: float = 1.0
    weight: float = 1.0

class ExtractResponse(BaseModel):
    nodes: List[GraphNodeBase]
    edges: List[GraphEdgeBase]

class ChunkResult(BaseModel):
    id: str
    note_id: str
    content: str
    score: float
    source: str = "rag"

class NoteResult(BaseModel):
    id: str
    title: str
    content: str
    score: float
    source: str = "rag"
    path: Optional[List[Dict[str, Any]]] = None
