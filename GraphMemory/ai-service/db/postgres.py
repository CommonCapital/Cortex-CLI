import asyncpg
import os
import json
from contextlib import asynccontextmanager

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://memoryos:memoryos@localhost:5432/memoryos")

_pool = None

async def init_pool():
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL)
        async with _pool.acquire() as conn:
            try:
                await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            except Exception as e:
                print("Could not create vector extension:", e)

async def close_pool():
    global _pool
    if _pool is not None:
        await _pool.close()

@asynccontextmanager
async def get_db():
    global _pool
    if _pool is None:
        await init_pool()
    async with _pool.acquire() as conn:
        yield conn
