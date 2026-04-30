from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import embed, rag, graph, extract, memory, vector, retrieval

app = FastAPI(title="MemoryOS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(embed.router, prefix="/embed", tags=["Embedding"])
app.include_router(rag.router, prefix="/rag", tags=["RAG"])
app.include_router(graph.router, prefix="/graph", tags=["Graph"])
app.include_router(extract.router, prefix="/extract", tags=["Extract"])
app.include_router(memory.router, prefix="/memory", tags=["Memory"])
app.include_router(vector.router, prefix="/vector", tags=["Vector"])
app.include_router(retrieval.router, prefix="/retrieval", tags=["Retrieval"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
