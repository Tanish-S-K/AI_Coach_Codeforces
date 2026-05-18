import os
from typing import Any, Dict

from dotenv import load_dotenv

load_dotenv()

try:
    from google import genai
    from google.genai import types
except Exception:
    genai = None
    types = None


def _build_fallback_report(analysis: Dict[str, Any]) -> str:
    profile = analysis["profile"]
    strengths = ", ".join(profile["strengths"][:3]) or "steady participation"
    weaknesses = ", ".join(profile["focus_areas"][:3]) or "contest execution"
    plan = analysis["training_plan"]["weekly_focus"]
    contest_note = analysis["recent_contests"][0]["headline"] if analysis["recent_contests"] else "Recent contests are limited."

    return (
        f"{profile['handle']} is currently {profile['rank']} with a rating of {profile['rating']}. "
        f"The strongest signals in the data are {strengths}. "
        f"The clearest gaps are {weaknesses}. "
        f"{contest_note} "
        f"The next training block should prioritize {plan[0]}, then {plan[1]}, and finally {plan[2]}. "
        "This report was generated from deterministic coaching heuristics because a live Gemini response was unavailable."
    )


def query_ai_model(prompt: str, analysis: Dict[str, Any]) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or genai is None or types is None:
        return {
            "provider": "local-heuristic",
            "status": "fallback",
            "report": _build_fallback_report(analysis),
        }

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=(
                    "You are an elite competitive programming coach. "
                    "Use the supplied metrics to produce a sharp but supportive performance review. "
                    "Ground every claim in the data. "
                    "Prefer concrete improvement priorities over generic motivation. "
                    "Write concise paragraphs with clear transitions."
                ),
                temperature=0.4,
            ),
        )
        return {
            "provider": "gemini-2.5-flash",
            "status": "ok",
            "report": response.text,
        }
    except Exception as exc:
        return {
            "provider": "local-heuristic",
            "status": "fallback",
            "report": _build_fallback_report(analysis),
            "error": str(exc),
        }
