import time
from datetime import datetime, UTC
from collections import defaultdict
import cf_api as api
from cf_api import conditional_memoize


@conditional_memoize(timeout=3600)
def contest_analysis(handle, count=10):
    rating_history = api.raw_rating(handle)
    status = api.raw_status(handle)
    contest_map = api.get_contest_map()

    recent_contests = rating_history[-count:]
    submissions_by_contest = defaultdict(list)

    for sub in status:
        if 'contestId' in sub:
            submissions_by_contest[sub['contestId']].append(sub)

    result = []

    for contest in recent_contests:
        cid = contest['contestId']
        name = contest.get('contestName', 'Unknown')
        rank = contest.get('rank', 'N/A')
        old_rating = contest.get('oldRating', 'Unrated')
        new_rating = contest.get('newRating', 'Unrated')
        delta = new_rating - old_rating
        end_time = contest.get('ratingUpdateTimeSeconds', 0)
        date = datetime.fromtimestamp(end_time, UTC).strftime('%Y-%m-%d')
        duration_secs = contest_map.get(cid, {}).get("durationSeconds", 7200)
        start_time = end_time - duration_secs

        submissions = submissions_by_contest.get(cid, [])
        submissions_by_problem = defaultdict(list)

        for sub in submissions:
            prob = sub.get("problem", {})
            index = prob.get("index", "")
            pid = f"{cid}-{index}"
            submissions_by_problem[pid].append(sub)

        tags = set()
        difficulties = []
        first_ac = None
        last_ac = None

        solved_problems = []
        upsolved_problems = []
        unsolved_problems = []

        for pid, subs in submissions_by_problem.items():
            subs.sort(key=lambda s: s.get("creationTimeSeconds", 0))
            prob = subs[0].get("problem", {})
            wa_during_contest = 0
            total_subs = len(subs)
            first_ac_time = None
            solved_in_contest = False
            solved_after = False
            ac_time = None

            for sub in subs:
                verdict = sub.get("verdict", "")
                ts = sub.get("creationTimeSeconds", 0)

                if verdict == "OK":
                    ac_time = ts
                    if start_time <= ts <= end_time:
                        first_ac_time = ts
                        solved_in_contest = True
                    else:
                        solved_after = True
                    break

                if ts <= end_time:
                    wa_during_contest += 1

            info = {
                "name": prob.get("name", ""),
                "index": prob.get("index", ""),
                "rating": prob.get("rating", "Unrated"),
                "tags": prob.get("tags", []),
                "wrong_submissions": wa_during_contest,
                "total_submissions": total_subs,
            }

            if solved_in_contest:
                info["first_ac_time"] = datetime.fromtimestamp(first_ac_time, UTC).strftime("%H:%M:%S")
                solved_problems.append(info)

                if first_ac is None or first_ac_time < first_ac:
                    first_ac = first_ac_time
                if last_ac is None or first_ac_time > last_ac:
                    last_ac = first_ac_time

                tags.update(info["tags"])
                if isinstance(info["rating"], int):
                    difficulties.append(info["rating"])

            elif solved_after:
                info["first_ac_time"] = datetime.fromtimestamp(ac_time, UTC).strftime("%H:%M:%S")
                upsolved_problems.append(info)

            else:
                unsolved_problems.append(info)

        num_attempted = len(submissions_by_problem)
        num_solved = len(solved_problems)
        accuracy = f"{num_solved}/{num_attempted}" if num_attempted else "0/0"
        duration = (last_ac - first_ac) // 60 if first_ac and last_ac else None

        result.append({
            "contest_id": cid,
            "contest_name": name,
            "date": date,
            "division": (
                "Div. 1" if "Div. 1" in name else
                "Div. 2" if "Div. 2" in name else
                "Div. 3" if "Div. 3" in name else
                "Div. 4" if "Div. 4" in name else "Unknown"
            ),
            "rank": rank,
            "old_rating": old_rating,
            "new_rating": new_rating,
            "delta": delta,
            "problems_attempted": num_attempted,
            "problems_solved": num_solved,
            "accuracy": accuracy,
            "first_ac_time": datetime.fromtimestamp(first_ac, UTC).strftime('%H:%M:%S') if first_ac else "N/A",
            "last_ac_time": datetime.fromtimestamp(last_ac, UTC).strftime('%H:%M:%S') if last_ac else "N/A",
            "duration_between_first_last_ac_mins": duration if duration is not None else "N/A",
            "solved_tags": list(tags),
            "solved_difficulties": difficulties,
            "solved_problems": solved_problems,
            "upsolved_problems": upsolved_problems,
            "unsolved_problems": unsolved_problems
        })

    return result

import random

def ai_contest_prompt(handle: str, user_info: dict, contests: list) -> str:
    intro_styles = [
        f"You are a dedicated Codeforces coach reviewing {handle}'s performance.",
        f"As a competitive programming mentor, you've been tracking {handle}'s journey.",
        f"Imagine you're helping {handle}, a growing CP enthusiast, analyze their contests.",
        f"You’re a performance coach for {handle}, who is trying to improve in Codeforces."
    ]
    
    context_intro = random.choice(intro_styles)
    
    lines = [context_intro]
    lines.append(f"\nTheir current rating is {user_info['rating']} and their rank is '{user_info['rank']}'.")

    for contest in contests:
        lines.append(f"\n📘 **{contest['contest_name']}**")
        lines.append(f"- Division: {contest['division']}")
        lines.append(f"- Date: {contest['date']}")
        lines.append(f"- Rank: {contest['rank']}, Rating Change: {contest['old_rating']} → {contest['new_rating']} (Δ {contest['delta']})")
        lines.append(f"- Solved {contest['problems_solved']} out of {contest['problems_attempted']} problems.")
        
        if contest.get("upsolved_problems"):
            lines.append(f"- Upsolved {len(contest['upsolved_problems'])} problem(s) after the contest.")
        
        lines.append(f"- First AC: {contest['first_ac_time']}, Last AC: {contest['last_ac_time']}, Duration: {contest['duration_between_first_last_ac_mins']} mins.")

        tags = contest.get("solved_tags", [])
        if tags:
            lines.append(f"- Covered tags: {', '.join(tags)}")

        diffs = contest.get("solved_difficulties", [])
        if diffs:
            lines.append(f"- Problem difficulties solved: {sorted(diffs)}")

        lines.append("")

    lines.append("\n🧠 Based on all this information, give personalized advice to help the user improve.")
    lines.append("You can comment on habits, strengths, weaknesses, timing, consistency, accuracy, and topic diversity.")
    
    behavior_styles = [
        "Be honest but supportive.",
        "Give advice like a seasoned coach who's seen their progress.",
        "Offer a mix of encouragement and constructive feedback.",
        "Vary your tone — it can be serious, playful, or motivational, but always helpful.",
    ]
    lines.append(random.choice(behavior_styles))

    lines.append("\nDo not list things like a robot. Write your response in paragraphs, like a real coach would speak to their student.")
    
    return "\n".join(lines)



