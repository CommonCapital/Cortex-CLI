from typing import AsyncGenerator, List, Dict, Any
from services.graph_service import get_llm

def build_context(results: List[Dict[str, Any]]) -> str:
    context = ""
    for r in results:
        context += f"--- Note (Source: {r['source']}) ---\n{r['content']}\n\n"
    return context

def build_prompt(question: str, context: str, history: List[Dict[str, str]]) -> str:
    history_str = ""
    for msg in history:
        history_str += f"{msg['role']}: {msg['content']}\n"
        
    prompt = f"""
You are MemoryOS, an intelligent personal knowledge base assistant.
Use the following retrieved context from the user's notes and knowledge graph to answer their question.
If the answer is not in the context, you can use your general knowledge, but prioritize the context.

Context:
{context}

Conversation History:
{history_str}

User Question: {question}
Answer:"""
    return prompt

async def stream_answer(prompt: str) -> AsyncGenerator[str, None]:
    llm = get_llm()
    async for chunk in llm.astream(prompt):
        if chunk.content:
            yield chunk.content
