import os
from typing import List
from dotenv import load_dotenv
from pinecone import Pinecone

# Load environment variables
load_dotenv()

# Pinecone credentials
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX")

# Initialize Pinecone client and index
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX)


def upsert_embeddings(vectors: List[List[float]], file_id: str, chunks: List[str], user_id: str, bot_id: str):
    """
    Upserts embedding vectors into Pinecone with metadata.
    """
    payload = []
    for i, (vector, text) in enumerate(zip(vectors, chunks)):
        vector_id = f"{file_id}-{i}"
        payload.append({
            "id": vector_id,
            "values": vector,
            "metadata": {
                "file_id": file_id,
                "chunk_index": i,
                "text": text,
                "user_id": user_id,
                "bot_id": bot_id
            }
        })
    
    # FIX: Removed await from sync call
    index.upsert(vectors=payload)

def query_similar_documents(vector: List[float], bot_id: str, top_k: int = 15):
    """
    Queries for documents similar to the given vector.
    """
    # FIX: Removed await from sync call
    query_response = index.query(
        vector=vector,
        filter={"bot_id": bot_id},
        top_k=top_k,
        include_metadata=True
    )
    return query_response['matches']
