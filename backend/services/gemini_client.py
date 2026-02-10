# services/gemini_client.py
from services.embedding_client import get_embeddings
from services.pinecone_client import query_similar_documents
from services.prompt_builder import build_prompt
import os
import logging # Import logging
from vertexai.generative_models import GenerativeModel

# Configure logging (ensure this is configured appropriately for your environment)
logging.basicConfig(level=logging.INFO)

model = GenerativeModel(os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash-001"))

async def get_gemini_response_streaming_rag(user_input: str, user_id: str, bot_id: str):
    logging.info(f"Received chat query: {user_input} for bot_id: {bot_id}") # Log received query

    # Step 1: Get embedding for the user input
    # This part is correct, it uses user_input to get the embedding
    embeddings = await get_embeddings([user_input])
    query_embedding = embeddings[0]

    # Step 2: Query Pinecone for similar documents
    # FIX: Call query_similar_documents with the correct arguments:
    #      the query_embedding and the bot_id.
    #      Also, remove 'await' as query_similar_documents is synchronous.
    top_chunks = query_similar_documents(query_embedding, bot_id)

    logging.info(f"Retrieved {len(top_chunks)} chunks from Pinecone.") # Log number of retrieved chunks
    # Ensure retrieved chunks have 'text' in metadata before logging
    for i, chunk in enumerate(top_chunks):
         if 'metadata' in chunk and 'text' in chunk['metadata']:
              logging.info(f"Chunk {i+1}: {chunk['metadata']['text']}") # Log each retrieved chunk's text
         else:
              logging.info(f"Chunk {i+1}: [Metadata or text missing]")


    if not top_chunks:
        logging.warning("No chunks retrieved from Pinecone for this query.") # Log warning if no chunks
        yield "The information is not available in the provided context."
        return

    # Step 3: Build the prompt for the language model
    # Extract the text from the metadata of the retrieved chunks
    context_texts = [chunk['metadata']['text'] for chunk in top_chunks if 'metadata' in chunk and 'text' in chunk['metadata']]
    prompt = build_prompt(user_input, context_texts)

    logging.info(f"Prompt sent to Gemini:\n{prompt}") # Log the full prompt

    # Step 4: Get streaming response from Gemini
    stream = model.generate_content(prompt, stream=True)

    for chunk in stream:
        yield chunk.text or ""
