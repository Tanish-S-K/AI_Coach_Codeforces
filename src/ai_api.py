import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client()

def query_ai_model(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="""
                You are a helpful Codeforces coach. When a user asks a question, read their rating and problem history.
                Respond in a friendly and specific tone. Write your response in short paragraphs like a real coach.
                """,
                temperature=0.7,
            )
        )
        return response.text
    except Exception as e:
        return f"API Error: {str(e)}"