# services/url_parser.py

import httpx
from bs4 import BeautifulSoup

async def fetch_text_from_url(url: str) -> str:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            # Remove script and style elements
            for element in soup(["script", "style"]):
                element.decompose()

            text = soup.get_text(separator=' ')
            clean_text = ' '.join(text.split())

            return clean_text

        except Exception as e:
            raise ValueError(f"Failed to fetch or parse URL: {e}")