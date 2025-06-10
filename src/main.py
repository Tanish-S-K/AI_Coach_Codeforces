from cf_api import get_user_data
from ai_api import query_ai_model

def build_prompt(user_info, rating_history, problem_history, user_question):
    handle = user_info.get("handle", "Unknown")
    rank = user_info.get("rank", "Unknown")
    max_rank = user_info.get("maxRank", "Unknown")
    rating = user_info.get("rating", "Unrated")
    max_rating = user_info.get("maxRating", "Unknown")

    prompt = f"""
            You are a helpful and experienced competitive programming coach. A user has come to you for personalized advice.
            response: In a structured manner with emojis.

            example response:

                something....

                *something
                    something
                    something
                *something
                    something
                    something
                .
                ..

                something...

            📛 Handle: {handle}
            📈 Current rank: {rank}
            🏅 Max rank: {max_rank}
            🔢 Current rating: {rating}
            🌟 Max rating: {max_rating}

            📚 Recent Problem History (rating, tags, verdict):
            {problem_history}

            📊 Recent Rating History (contest_rank, old_rating, new_rating):
            {rating_history}

            Please read the user's question below and give a detailed, actionable response — ideally with problem suggestions or study strategies tailored to their level.

            🗣️ User's question:
            "{user_question}"
            """
    return prompt

def main():
    handle = input("🔍 Enter your Codeforces handle: ").strip()
    question = input("❓ What do you want help with? ").strip()

    print("\n⏳ Fetching Codeforces data...")
    try:
        cf_data = get_user_data(handle)
    except Exception as e:
        print(f"❌ Failed to retrieve user data: {e}")
        return

    user_info = cf_data["user_info"]
    rating_history = cf_data["rating_history"]
    problem_history = cf_data["problem_history"]

    print("🧠 Building AI prompt...")
    prompt = build_prompt(user_info, rating_history, problem_history, question)

    print("\n🤖 Querying AI...")
    response = query_ai_model(prompt)

    print("\n=== 🧑‍🏫 AI Coach Response ===\n")
    print(response)

if __name__ == "__main__":
    main()
