import requests
from datetime import datetime
from collections import defaultdict


BASE_URL = "https://codeforces.com/api"


def fetch_data(url):
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"❌ Failed to fetch data from {url}")
    return response.json().get("result", [])


# ==================== 👤 USER INFO ====================
def get_user_info(handle):
    url = f"{BASE_URL}/user.info?handles={handle}&checkHistoricHandles=false"
    result = fetch_data(url)[0]

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


# ==================== 📊 RATING HISTORY ====================
def get_rating_history(handle):
    url = f"{BASE_URL}/user.rating?handle={handle}"
    result = fetch_data(url)

    contest_history = []
    for entry in result:
        name = entry.get("contestName", "Unknown")
        division = "Unknown"
        if "Div. 1" in name:
            division = "Div. 1"
        elif "Div. 2" in name:
            division = "Div. 2"
        elif "Div. 3" in name:
            division = "Div. 3"
        elif "Div. 4" in name:
            division = "Div. 4"

        contest = {
            "contest_name": name,
            "contest_id": entry.get("contestId", 0),
            "division": division,
            "rank": entry.get("rank", "N/A"),
            "old_rating": entry.get("oldRating", "N/A"),
            "new_rating": entry.get("newRating", "N/A")
        }
        contest_history.append(contest)

    return contest_history


# ==================== 📚 PROBLEM HISTORY ====================
def get_problem_history(handle):
    url = f"{BASE_URL}/user.status?handle={handle}"
    result = fetch_data(url)

    solved = []
    seen = set()

    for submission in result:
        if submission.get("verdict") != "OK":
            continue

        name = submission.get("problem", {}).get("name", "")
        contest_id = submission.get("contestId", 0)
        index = submission.get("problem", {}).get("index", "")
        unique_id = f"{contest_id}-{index}"

        if unique_id in seen:
            continue
        seen.add(unique_id)

        solved.append({
            "name": name,
            "contest_id": contest_id,
            "index": index,
            "rating": submission.get("problem", {}).get("rating", "Unrated"),
            "tags": submission.get("problem", {}).get("tags", []),
            "verdict": submission.get("verdict", "Unknown")
        })

    return solved


# ==================== 📅 WEEKLY PROGRESS ====================
def get_weekly_solved_problems(handle, weeks=10):
    url = f"{BASE_URL}/user.status?handle={handle}"
    result = fetch_data(url)

    weekly_counts = defaultdict(int)
    now = datetime.utcnow()

    for submission in result:
        if submission.get("verdict") != "OK":
            continue
        ts = submission.get("creationTimeSeconds", 0)
        submit_time = datetime.utcfromtimestamp(ts)
        week_diff = (now - submit_time).days // 7

        if 0 <= week_diff < weeks:
            weekly_counts[weeks - week_diff - 1] += 1

    return [weekly_counts[i] for i in range(weeks)]
