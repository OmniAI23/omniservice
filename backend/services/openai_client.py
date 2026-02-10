import os
from dotenv import load_dotenv
load_dotenv()  # Load environment variables first

from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_openai_response(user_input):
    response = client.chat.completions.create(
        # Load model name from environment variable
        model=os.getenv("OPENAI_MODEL_NAME", "gpt-3.5-turbo"), # Default to gpt-3.5-turbo if env var not set
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": user_input}
        ],
        # Load temperature from environment variable and convert to float
        temperature=float(os.getenv("OPENAI_TEMPERATURE", 0.7)) # Default to 0.7 if env var not set
    )
    return response.choices[0].message.content

