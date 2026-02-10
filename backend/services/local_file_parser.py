import os
import uuid
import logging
import anyio
from fastapi import UploadFile

from services.audio_processor import (
    convert_to_wav,
    upload_to_gcs,
    transcribe_gcs,
)

logging.basicConfig(level=logging.INFO)


async def process_uploaded_file(file: UploadFile):
    logging.info(f"🎬 Processing uploaded file: {file.filename}")

    # Use a temporary directory for processing
    upload_dir = os.path.join("/tmp", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    # Save the uploaded file temporarily
    input_path = os.path.join(upload_dir, file.filename)
    try:
        with open(input_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Define the path for the WAV file
        wav_filename = f"{uuid.uuid4()}.wav"
        wav_path = os.path.join(upload_dir, wav_filename)

        # 1. Convert to WAV
        await convert_to_wav(input_path, wav_path)

        # 2. Upload to GCS
        blob_name = f"audio/{wav_filename}"
        gcs_uri = await upload_to_gcs(wav_path, blob_name)

        # 3. Transcribe
        transcript = await transcribe_gcs(gcs_uri)

        return transcript

    except Exception as e:
        logging.error(f"❌ Error processing uploaded file: {e}")
        raise e  # Re-raise the exception to be handled by the endpoint

    finally:
        # 4. Clean up temporary files
        if os.path.exists(input_path):
            os.remove(input_path)
            logging.info(f"Temporary input file deleted: {input_path}")
        # The wav_path might not be created if an error occurs early
        if 'wav_path' in locals() and os.path.exists(wav_path):
            os.remove(wav_path)
            logging.info(f"Temporary WAV file deleted: {wav_path}")
