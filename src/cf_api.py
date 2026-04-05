import time
import requests
from datetime import datetime
from flask_caching import Cache
from collections import defaultdict

# ========== Cache Setup ==========
cache_proxy = {"instance": None}

def init_cache(app):
    cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})
    cache.init_app(app)
    cache_proxy["instance"] = cache

# ========== Codeforces API ==========
BASE_URL = "https://codeforces.com/api"

def fetch_data(url):
    for i in range(3):
        response = requests.get(url)
        if response.status_code == 200:
            return response.json().get("result", [])
        if response.status_code == 400:
            raise Exception(f"❌ Bad Request from {url}: {response.text}")
        time.sleep(1)
    raise Exception(f"❌ Failed to fetch data from {url}")

# ========== Conditional Cache Decorator ==========
def conditional_memoize(timeout=3600):
    def decorator(func):
        def wrapped(*args, **kwargs):
            if cache_proxy["instance"] is not None:
                cached_func = cache_proxy["instance"].memoize(timeout)(func)
                return cached_func(*args, **kwargs)
            else:
                return func(*args, **kwargs)
        return wrapped
    return decorator

# ========== Raw API Functions ==========
@conditional_memoize(timeout=3600)
def raw_user_info(handle):
    url = f"{BASE_URL}/user.info?handles={handle}&checkHistoricHandles=false"
    return fetch_data(url)[0]

@conditional_memoize(timeout=3600)
def raw_rating(handle):
    url = f"{BASE_URL}/user.rating?handle={handle}"
    return fetch_data(url)

@conditional_memoize(timeout=1800)
def raw_status(handle):
    url = f"{BASE_URL}/user.status?handle={handle}"
    return fetch_data(url)

# ========== User Info ==========
@conditional_memoize(timeout=3600)
def get_user_info(handle):
    result = raw_user_info(handle)
    return {
        "handle": result.get("handle", "Unknown"),
        "rating": result.get("rating", "Unrated"),
        "maxRating": result.get("maxRating", "Unknown"),
        "rank": result.get("rank", "Unranked"),
        "maxRank": result.get("maxRank", "Unknown"),
        "avatar": result.get("avatar", ""),
        "registrationTime": datetime.utcfromtimestamp(result.get("registrationTimeSeconds", 0)).strftime("%Y-%m-%d"),
        "days_on_site": (datetime.utcnow() - datetime.utcfromtimestamp(result.get("registrationTimeSeconds", 0))).days
    }
@conditional_memoize(timeout=24 * 3600)
def get_contest_map():
    url = f"{BASE_URL}/contest.list"
    contests = fetch_data(url)
    return {c["id"]: c for c in contests if c.get("phase") == "FINISHED"}


# ========== Parsed Status ==========
@conditional_memoize(timeout=1800)
def parsed_status(handle, weeks=24):
    result = raw_status(handle)
    seen = set()
    solved = []
    weekly_counts = defaultdict(int)
    now = int(time.time())

    for submission in reversed(result):
        if "verdict" not in submission or "creationTimeSeconds" not in submission:
            continue

        verdict = submission["verdict"]
        if verdict != 'OK':
            continue

        prob = submission.get("problem", {})
        contest_id = submission.get("contestId", 0)
        index = prob.get("index", "").lower()
        unique_id = f"{contest_id}-{index}"
        sub_time = submission["creationTimeSeconds"]

        # Weekly solved count
        week_diff = (now - sub_time) // (7 * 24 * 3600)
        if 0 <= week_diff < weeks:
            weekly_counts[weeks - week_diff - 1] += 1

        if unique_id not in seen:
            seen.add(unique_id)
            solved.append({
                "name": prob.get("name", ""),
                "contest_id": contest_id,
                "index": index,
                "rating": prob.get("rating", "Unrated"),
                "tags": prob.get("tags", []),
                "verdict": verdict
            })

    return solved, [weekly_counts[i] for i in range(weeks)]

# ========== Public Access Helpers ==========
def get_problem_history(handle):
    solved, _ = parsed_status(handle)
    return solved

def get_weekly_solved_problems(handle):
    _, weekly = parsed_status(handle)
    return weekly

def get_rating_history(handle):
    rating_data = raw_rating(handle)
    contest_history = []

    for entry in rating_data:
        name = entry.get("contestName", "Unknown")
        division = (
            "Div. 1" if "Div. 1" in name else
            "Div. 2" if "Div. 2" in name else
            "Div. 3" if "Div. 3" in name else
            "Div. 4" if "Div. 4" in name else "Unknown"
        )

        contest_history.append({
            "contest_name": name,
            "contest_id": entry.get("contestId", 0),
            "division": division,
            "rank": entry.get("rank", "N/A"),
            "old_rating": entry.get("oldRating", "N/A"),
            "new_rating": entry.get("newRating", "N/A"),
            "solved": "N/A"
        })

    return contest_history
