from sentence_transformers import SentenceTransformer
import os
from typing import List

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
CACHE_DIR = os.getenv("MODEL_CACHE_PATH", "./model_cache")

_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME, cache_folder=CACHE_DIR)
    return _model

def embed_text(text: str) -> List[float]:
    model = get_model()
    # SentenceTransformer returns numpy array, we need float list for pgvector
    res = model.encode(text)
    return res.tolist()

def embed_batch(texts: List[str]) -> List[List[float]]:
    if not texts:
        return []
    model = get_model()
    res = model.encode(texts)
    return res.tolist()
