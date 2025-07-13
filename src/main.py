from flask import Flask, request, jsonify
from flask_cors import CORS
from cf_api import (
    get_user_info,
    get_rating_history,
    get_weekly_solved_problems,
    get_problem_history,
    init_cache,
    cache_proxy
)
from ai_api import query_ai_model
from contest_advice import contest_analysis
from contest_advice import ai_contest_prompt as make_ai_prompt_from_contests

app = Flask(__name__)
CORS(app)
init_cache(app)
cache = cache_proxy["instance"]


# api routes
@app.route('/user/info', methods=['GET'])
def route_user_info():
    handle = request.args.get('handle')
    if not handle:
        return jsonify({'error': 'Missing handle'}), 400
    try:
        return jsonify(get_user_info(handle))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/user/contest-advice', methods=['GET', 'POST'])
def route_contest_advice():
    handle = request.args.get("handle")
    if not handle:
        return jsonify({"error": "Missing handle parameter"}), 400

    cache_key = f"contest_advice_{handle}"
    cached_result = cache.get(cache_key)
    if cached_result:
        return jsonify(cached_result)

    try:
        user_info = get_user_info(handle)
        contest_data = contest_analysis(handle, count=3)

        prompt = make_ai_prompt_from_contests(handle, user_info, contest_data)
        advice = query_ai_model(prompt)

        result = {
            "advice": advice,
            "contest_summary": contest_data
        }

        cache.set(cache_key, result, timeout=3600)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
    try:
        return jsonify(get_weekly_solved_problems(handle))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/user/contest-problem-stats', methods=['GET'])
def route_contest_problem_stats():
    handle = request.args.get('handle')
    if not handle:
        return jsonify({'error': 'Missing handle'}), 400
    try:
        return jsonify(get_contest_problem_stats(handle))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/user/contest-stats', methods=['POST', 'GET'])
def route_contest_stats():
    try:
        contests = request.get_json()
        if not contests:
            return jsonify({'error': 'No input JSON received'}), 400
        stats = compute_contest_stats(contests)
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/user/rating-history")
def route_rating_history():
    handle = request.args.get("handle")
    if not handle:
        return jsonify({"error": "Missing handle"}), 400

    try:
        contests = contest_analysis(handle, count=100)
        return jsonify([
            {
                "contest_name": c["contest_name"],
                "contest_id": c["contest_id"],
                "division": c["division"],
                "new_rating": c["new_rating"],
                "old_rating": c["old_rating"],
                "solved": c["problems_solved"]
            }
            for c in contests
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
