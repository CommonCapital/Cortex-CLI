from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List

def chunk_note(content: str) -> List[str]:
    if not content:
        return []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=60,
        separators=["\n\n", "\n", ".", "?", "!", " ", ""]
    )
    return splitter.split_text(content)
