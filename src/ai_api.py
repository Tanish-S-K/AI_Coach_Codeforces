
import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def query_ai_model(prompt: str) -> str:
    if not OPENROUTER_API_KEY:
        return "Missing OpenRouter API key. Please set it in .env."

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chat.openai.com",
        "X-Title": "AI Coach"
    }

    data = {
        "model": "mistralai/mistral-7b-instruct:free",
        "temperature": 0.7,
        "messages": [
            {"role": "system", "content": """
            You are a helpful Codeforces coach. When a user asks a question, read their rating and problem history.
            Respond in a friendly and specific tone, e.g.:
            - "You're solving a lot of DP problems recently — great! Try harder variations or practice under time pressure."
            - 🗣️ A user has asked you the following question. Focus on answering it directly and only use their Codeforces history if it helps clarify your advice

            Use that pattern to help the user below.
            """}
            ,
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        return f"API Error: {response.status_code}\n{response.text}"
