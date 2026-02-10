import os
import uuid
import subprocess
import logging
import anyio

from google.cloud import storage
import google.cloud.speech as speech

# Set your bucket name here
BUCKET_NAME = "video-transcribe-bot"

# Enable basic logging
logging.basicConfig(level=logging.INFO)

async def convert_to_wav(input_path, output_path):
    logging.info(f"🔄 Converting {input_path} to WAV ({output_path})")
    try:
        command = ["ffmpeg", "-y", "-i", input_path, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", output_path]
        await anyio.to_thread.run_sync(
            lambda: subprocess.run(command, check=True)
        )
    except subprocess.CalledProcessError as e:
        logging.error(f"❌ ffmpeg failed: {e}")
        raise RuntimeError("Audio conversion failed")

async def upload_to_gcs(source_file_name, destination_blob_name):
    logging.info(f"☁️ Uploading {source_file_name} to GCS bucket {BUCKET_NAME} as {destination_blob_name}")
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(destination_blob_name)
    await anyio.to_thread.run_sync(blob.upload_from_filename, source_file_name)

    gcs_uri = f"gs://{BUCKET_NAME}/{destination_blob_name}"
    logging.info(f"✅ Uploaded to: {gcs_uri}")
    return gcs_uri

async def transcribe_gcs(gcs_uri):
    logging.info(f"🧠 Transcribing audio from GCS: {gcs_uri}")
    client = speech.SpeechClient()

    audio = speech.RecognitionAudio(uri=gcs_uri)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code="en-US",
        enable_automatic_punctuation=True
    )

    operation = client.long_running_recognize(config=config, audio=audio)
    logging.info("⏳ Waiting for transcription operation to complete...")
    
    response = await anyio.to_thread.run_sync(lambda: operation.result(timeout=600))

    transcript = " ".join([result.alternatives[0].transcript for result in response.results])
    logging.info(f"✅ Transcription complete. Length: {len(transcript)} characters")
    return transcript
