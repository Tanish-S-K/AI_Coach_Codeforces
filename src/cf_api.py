import time
from collections import defaultdict
from datetime import UTC, datetime
from functools import wraps
from typing import Any, Dict, List, Tuple

import requests
from flask_caching import Cache

BASE_URL = "https://codeforces.com/api"
REQUEST_TIMEOUT = 20
HTTP_SESSION = requests.Session()
HTTP_SESSION.trust_env = False

cache_proxy = {"instance": None}


def init_cache(app) -> None:
    cache = Cache(app, config={"CACHE_TYPE": "SimpleCache"})
    cache.init_app(app)
    cache_proxy["instance"] = cache


def conditional_memoize(timeout: int = 3600):
    def decorator(func):
        @wraps(func)
        def wrapped(*args, **kwargs):
            cache = cache_proxy["instance"]
            if cache is None:
                return func(*args, **kwargs)
            cached_func = cache.memoize(timeout)(func)
            return cached_func(*args, **kwargs)

        return wrapped

    return decorator


def fetch_data(url: str) -> Any:
    last_error = None
    for _ in range(3):
        try:
            response = HTTP_SESSION.get(url, timeout=REQUEST_TIMEOUT)
            payload = response.json()
        except Exception as exc:
            last_error = exc
            time.sleep(1)
            continue

        if response.status_code == 200 and payload.get("status") == "OK":
            return payload.get("result", [])

        if response.status_code == 400:
            raise Exception(payload.get("comment", response.text))

        last_error = Exception(
            payload.get("comment", f"Unexpected Codeforces response ({response.status_code})")
        )
        time.sleep(1)

    raise Exception(f"Failed to fetch Codeforces data: {last_error}")


@conditional_memoize(timeout=3600)
def raw_user_info(handle: str) -> Dict[str, Any]:
    url = f"{BASE_URL}/user.info?handles={handle}&checkHistoricHandles=false"
    return fetch_data(url)[0]


@conditional_memoize(timeout=3600)
def raw_rating(handle: str) -> List[Dict[str, Any]]:
    url = f"{BASE_URL}/user.rating?handle={handle}"
    return fetch_data(url)


@conditional_memoize(timeout=1800)
def raw_status(handle: str) -> List[Dict[str, Any]]:
    url = f"{BASE_URL}/user.status?handle={handle}"
    return fetch_data(url)


@conditional_memoize(timeout=24 * 3600)
def get_contest_map() -> Dict[int, Dict[str, Any]]:
    contests = fetch_data(f"{BASE_URL}/contest.list")
    return {contest["id"]: contest for contest in contests if contest.get("phase") == "FINISHED"}


@conditional_memoize(timeout=3600)
def get_user_info(handle: str) -> Dict[str, Any]:
    result = raw_user_info(handle)
    registration_ts = result.get("registrationTimeSeconds", 0)
    registration_date = datetime.fromtimestamp(registration_ts, UTC)
    now = datetime.now(UTC)

    return {
        "handle": result.get("handle", handle),
        "rating": result.get("rating", 0),
        "maxRating": result.get("maxRating", 0),
        "rank": result.get("rank", "unrated"),
        "maxRank": result.get("maxRank", "unrated"),
        "avatar": result.get("avatar", ""),
        "titlePhoto": result.get("titlePhoto", ""),
        "registrationTime": registration_date.strftime("%Y-%m-%d"),
        "days_on_site": (now - registration_date).days,
        "contribution": result.get("contribution", 0),
        "friendOfCount": result.get("friendOfCount", 0),
        "organization": result.get("organization", ""),
        "country": result.get("country", ""),
        "city": result.get("city", ""),
        "last_online": datetime.fromtimestamp(
            result.get("lastOnlineTimeSeconds", registration_ts), UTC
        ).strftime("%Y-%m-%d"),
    }


@conditional_memoize(timeout=1800)
def parsed_status(handle: str, weeks: int = 24) -> Tuple[List[Dict[str, Any]], List[int], List[Dict[str, Any]]]:
    submissions = raw_status(handle)
    unique_solved = set()
    solved_history: List[Dict[str, Any]] = []
    weekly_counts = defaultdict(int)
    now_ts = int(time.time())

    for submission in reversed(submissions):
        creation_time = submission.get("creationTimeSeconds")
        verdict = submission.get("verdict")
        if not creation_time or verdict != "OK":
            continue

        problem = submission.get("problem", {})
        contest_id = submission.get("contestId", 0)
        index = problem.get("index", "")
        unique_id = f"{contest_id}-{index}-{problem.get('name', '')}"

        week_diff = (now_ts - creation_time) // (7 * 24 * 3600)
        if 0 <= week_diff < weeks:
            weekly_counts[weeks - week_diff - 1] += 1

        if unique_id in unique_solved:
            continue

        unique_solved.add(unique_id)
        solved_history.append(
            {
                "name": problem.get("name", ""),
                "contest_id": contest_id,
                "index": index,
                "rating": problem.get("rating"),
                "tags": problem.get("tags", []),
                "solved_at": datetime.fromtimestamp(creation_time, UTC).strftime("%Y-%m-%d"),
                "solved_timestamp": creation_time,
            }
        )

    return solved_history, [weekly_counts[i] for i in range(weeks)], submissions


def get_problem_history(handle: str) -> List[Dict[str, Any]]:
    solved, _, _ = parsed_status(handle)
    return solved


def get_weekly_solved_problems(handle: str, weeks: int = 24) -> List[Dict[str, Any]]:
    _, weekly, _ = parsed_status(handle, weeks=weeks)
    return [
        {
            "label": f"W{index + 1}",
            "count": count,
        }
        for index, count in enumerate(weekly)
    ]


def get_rating_history(handle: str) -> List[Dict[str, Any]]:
    history = raw_rating(handle)
    parsed = []

    for entry in history:
        contest_name = entry.get("contestName", "Unknown")
        old_rating = entry.get("oldRating", 0)
        new_rating = entry.get("newRating", 0)
        parsed.append(
            {
                "contest_id": entry.get("contestId", 0),
                "contest_name": contest_name,
                "date": datetime.fromtimestamp(
                    entry.get("ratingUpdateTimeSeconds", 0), UTC
                ).strftime("%Y-%m-%d"),
                "rank": entry.get("rank", 0),
                "old_rating": old_rating,
                "new_rating": new_rating,
                "delta": new_rating - old_rating,
                "division": infer_division(contest_name),
            }
        )

    return parsed


def infer_division(contest_name: str) -> str:
    for division in ("Div. 1", "Div. 2", "Div. 3", "Div. 4"):
        if division in contest_name:
            return division
    return "Mixed"
