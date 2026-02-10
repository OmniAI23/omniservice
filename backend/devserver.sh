#!/bin/sh
source .venv/bin/activate
# Use the PORT environment variable if it is set, otherwise default to 8080
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --reload
