from vertexai.preview.language_models import TextEmbeddingModel, TextEmbeddingInput
import os
import vertexai
from services.pinecone_client import upsert_embeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Initialize Vertex AI
vertexai.init(
    project=os.getenv("GCP_PROJECT_ID"),
    location=os.getenv("GCP_LOCATION")
)

async def get_embeddings(texts):
    model = TextEmbeddingModel.from_pretrained(os.getenv("EMBEDDING_MODEL_NAME", "text-embedding-005"))
    instances = [TextEmbeddingInput(task_type="RETRIEVAL_DOCUMENT", text=text) for text in texts]
    # The new model's get_embeddings is not a coroutine, so no await is needed here.
    embeddings = model.get_embeddings(instances)
    return [embedding.values for embedding in embeddings]

async def process_and_store_text(text: str, source_id: str, user_id: str, bot_id: str):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = text_splitter.split_text(text)
    vectors = await get_embeddings(chunks)
    # FIX: Removed await from the now-synchronous upsert_embeddings function
    upsert_embeddings(vectors, source_id, chunks, user_id, bot_id)
