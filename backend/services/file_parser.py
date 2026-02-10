import os
from pypdf import PdfReader
from docx import Document
import anyio

# A mapping from content types to file extensions
CONTENT_TYPE_MAP = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}

async def process_file(filepath: str, content_type: str) -> str:
    ext = CONTENT_TYPE_MAP.get(content_type)
    if ext == "pdf":
        return await anyio.to_thread.run_sync(parse_pdf, filepath)
    elif ext == "docx":
        return await anyio.to_thread.run_sync(parse_docx, filepath)
    elif ext == "txt":
        return await parse_txt(filepath)
    else:
        raise ValueError(f"Unsupported content type: {content_type}")

def parse_pdf(filepath: str) -> str:
    text = ""
    with open(filepath, "rb") as f:
        reader = PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text.strip()

def parse_docx(filepath: str) -> str:
    doc = Document(filepath)
    return "\n".join([para.text for para in doc.paragraphs]).strip()

async def parse_txt(filepath: str) -> str:
    async with await anyio.open_file(filepath, "r", encoding="utf-8") as f:
        content = await f.read()
    return content.strip()
