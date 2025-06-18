from flask import Flask, request, jsonify
from flask_cors import CORS
from cf_api import get_user_data
from ai_api import query_ai_model

app = Flask(__name__)
CORS(app)

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
            \"{user_question}\"
            """
    return prompt


# ==================== 🔗 API ROUTES ====================

@app.route('/get_user_info', methods=['GET'])
def get_user_info():
    handle = request.args.get('handle')
    if not handle:
        return jsonify({'error': 'Missing handle'}), 400
    try:
        cf_data = get_user_data(handle)
        return cf_data
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
