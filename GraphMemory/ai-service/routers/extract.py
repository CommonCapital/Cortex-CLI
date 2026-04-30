from fastapi import APIRouter
from models.schemas import ExtractRequest
from services.graph_service import extract_entities

router = APIRouter()

@router.post("")
async def extract_endpoint(req: ExtractRequest):
    return await extract_entities(req.text)
