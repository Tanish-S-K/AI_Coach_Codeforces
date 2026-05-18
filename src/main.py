from flask import Flask, jsonify, request
from flask_cors import CORS

from ai_api import query_ai_model
from cf_api import (
    get_problem_history,
    get_rating_history,
    get_user_info,
    get_weekly_solved_problems,
    init_cache,
)
from contest_advice import ai_contest_prompt, build_deep_analysis, compare_deep_analyses

app = Flask(__name__)
CORS(app)
init_cache(app)


def require_handle():
    handle = request.args.get("handle", "").strip()
    if not handle:
        return None, (jsonify({"error": "Missing handle parameter"}), 400)
    return handle, None


def require_pair():
    handle_a = request.args.get("handle_a", "").strip()
    handle_b = request.args.get("handle_b", "").strip()
    if not handle_a or not handle_b:
        return None, None, (jsonify({"error": "Missing handle_a or handle_b parameter"}), 400)
    if handle_a.lower() == handle_b.lower():
        return None, None, (jsonify({"error": "Please choose two different handles"}), 400)
    return handle_a, handle_b, None


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/user/info", methods=["GET"])
def route_user_info():
    handle, error = require_handle()
    if error:
        return error
    try:
        return jsonify(get_user_info(handle))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/user/rating-history", methods=["GET"])
def route_rating_history():
    handle, error = require_handle()
    if error:
        return error
    try:
        return jsonify(get_rating_history(handle))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/user/problem-history", methods=["GET"])
def route_problem_history():
    handle, error = require_handle()
    if error:
        return error
    try:
        return jsonify(get_problem_history(handle))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/user/weekly-progress", methods=["GET"])
def route_weekly_progress():
    handle, error = require_handle()
    if error:
        return error
    try:
        return jsonify(get_weekly_solved_problems(handle))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/user/deep-analysis", methods=["GET"])
def route_deep_analysis():
    handle, error = require_handle()
    if error:
        return error

    try:
        analysis = build_deep_analysis(handle)
        ai_payload = query_ai_model(ai_contest_prompt(handle, analysis), analysis)
        analysis["ai_report"] = ai_payload
        return jsonify(analysis)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/user/contest-advice", methods=["GET"])
def route_contest_advice():
    handle, error = require_handle()
    if error:
        return error

    try:
        analysis = build_deep_analysis(handle)
        ai_payload = query_ai_model(ai_contest_prompt(handle, analysis), analysis)
        return jsonify(
            {
                "advice": ai_payload["report"],
                "ai_provider": ai_payload["provider"],
                "ai_status": ai_payload["status"],
                "contest_summary": analysis["recent_contests"][:3],
                "training_plan": analysis["training_plan"],
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/user/compare", methods=["GET"])
def route_compare():
    handle_a, handle_b, error = require_pair()
    if error:
        return error

    try:
        analysis_a = build_deep_analysis(handle_a)
        analysis_b = build_deep_analysis(handle_b)
        comparison = compare_deep_analyses(handle_a, analysis_a, handle_b, analysis_b)
        return jsonify(comparison)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True)
