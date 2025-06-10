import requests

def get_user_data(handle):

    # urls
    rating_url = f"https://codeforces.com/api/user.rating?handle={handle}"
    problem_url = f"https://codeforces.com/api/user.status?handle={handle}&from=1&count=20"
    user_url = f"https://codeforces.com/api/user.info?handles={handle}&checkHistoricHandles=false"

    # requests
    rating_response = requests.get(rating_url)
    problem_response = requests.get(problem_url)
    user_response = requests.get(user_url)

    # check for errors
    if rating_response.status_code != 200 or problem_response.status_code != 200 or user_response.status_code != 200:
        raise Exception("❌ Failed to fetch data from Codeforces API.")

    # parse json
    rating_data = rating_response.json().get("result", [])
    problem_data = problem_response.json().get("result", [])
    user_data = user_response.json().get("result", [{}])[0]

    # format rating history
    rating_history = [
        {
            "contest_rank": entry.get("rank", "N/A"),
            "old_rating": entry.get("oldRating", "N/A"),
            "new_rating": entry.get("newRating", "N/A")
        }
        for entry in rating_data
    ]

    # filter and format problem history (only accepted problems)
    problem_history = [
        {
            "rating": problem.get("problem", {}).get("rating", "Unrated"),
            "tags": problem.get("problem", {}).get("tags", []),
            "verdict": problem.get("verdict", "Unknown")
        }
        for problem in problem_data if problem.get("verdict") == "OK"
    ]

    return {
        "user_info": {
            "handle": user_data.get("handle", "Unknown"),
            "rating": user_data.get("rating", "Unrated"),
            "maxRating": user_data.get("maxRating", "Unknown"),
            "rank": user_data.get("rank", "Unranked")
        },
        "rating_history": rating_history,
        "problem_history": problem_history
    }
