from fastapi import APIRouter

router = APIRouter()

@router.get("/session/{session_id}")
async def get_session(session_id: str):
    return {"messages": []}
