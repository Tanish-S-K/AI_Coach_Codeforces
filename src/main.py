from flask import Flask, request, jsonify
from flask_cors import CORS
from cf_api import (
    get_user_info,
    get_rating_history,
    get_weekly_solved_problems,
    get_problem_history,
)
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
Respond in a structured manner with emojis.

📛 Handle: {handle}
📈 Current rank: {rank}
🏅 Max rank: {max_rank}
🔢 Current rating: {rating}
🌟 Max rating: {max_rating}

📚 Recent Problem History (rating, tags, verdict):
{problem_history}

📊 Recent Rating History (contest_rank, old_rating, new_rating):
{rating_history}

🗣️ User's question:
\"{user_question}\"
"""
    return prompt


# ==================== 🔗 API ROUTES ====================

@app.route('/user/info', methods=['GET'])
def route_user_info():
    handle = request.args.get('handle')
    if not handle:
        return jsonify({'error': 'Missing handle'}), 400
    try:
        return jsonify(get_user_info(handle))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/user/rating-history', methods=['GET'])
def route_rating_history():
    handle = request.args.get('handle')
    try:
        return jsonify(get_rating_history(handle))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/user/problem-history', methods=['GET'])
def route_problem_history():
    handle = request.args.get('handle')
    try:
        return jsonify(get_problem_history(handle))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/user/weekly-progress', methods=['GET'])
def route_weekly_progress():
    handle = request.args.get('handle')
    weeks = int(request.args.get('weeks', 50))
    try:
        return jsonify(get_weekly_solved_problems(handle, weeks))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/user/ask-ai', methods=['POST'])
def route_ai_coach():
    data = request.json
    handle = data.get('handle')
    user_question = data.get('question')
    if not handle or not user_question:
        return jsonify({'error': 'Missing handle or question'}), 400
    try:
        user_info = get_user_info(handle)
        rating_history = get_rating_history(handle)
        problem_history = get_problem_history(handle)

        prompt = build_prompt(user_info, rating_history, problem_history, user_question)
        ai_response = query_ai_model(prompt)
        return jsonify({'response': ai_response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
