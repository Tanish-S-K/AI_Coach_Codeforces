from __future__ import annotations

import math
from collections import Counter, defaultdict
from datetime import UTC, datetime
from statistics import mean
from typing import Any, Dict, List

import cf_api as api
from cf_api import conditional_memoize


SKILL_BUCKETS = {
    "speed": ["implementation", "constructive algorithms", "greedy", "math"],
    "accuracy": ["brute force", "implementation", "sortings"],
    "depth": ["dp", "graphs", "data structures", "binary search"],
    "problem_reading": ["strings", "math", "greedy"],
    "resilience": ["graphs", "dp", "data structures"],
}


def clamp(value: float, low: int = 0, high: int = 100) -> int:
    return max(low, min(high, round(value)))


def average(values: List[float], default: float = 0.0) -> float:
    return mean(values) if values else default


def percentile_style_score(value: float, floor: float, ceiling: float) -> int:
    if ceiling <= floor:
        return 50
    scaled = (value - floor) / (ceiling - floor)
    return clamp(scaled * 100)


@conditional_memoize(timeout=3600)
def contest_analysis(handle: str, count: int = 8) -> List[Dict[str, Any]]:
    rating_history = api.raw_rating(handle)
    submissions = api.raw_status(handle)
    contest_map = api.get_contest_map()

    recent_contests = rating_history[-count:]
    submissions_by_contest: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
    for submission in submissions:
        contest_id = submission.get("contestId")
        if contest_id:
            submissions_by_contest[contest_id].append(submission)

    analyzed_contests: List[Dict[str, Any]] = []
    for contest in recent_contests:
        contest_id = contest["contestId"]
        contest_name = contest.get("contestName", "Unknown")
        rating_update = contest.get("ratingUpdateTimeSeconds", 0)
        duration_seconds = contest_map.get(contest_id, {}).get("durationSeconds", 7200)
        start_time = rating_update - duration_seconds
        contest_submissions = submissions_by_contest.get(contest_id, [])
        contest_result = analyze_single_contest(
            contest=contest,
            contest_name=contest_name,
            start_time=start_time,
            end_time=rating_update,
            submissions=contest_submissions,
        )
        analyzed_contests.append(contest_result)

    return analyzed_contests


def analyze_single_contest(
    contest: Dict[str, Any],
    contest_name: str,
    start_time: int,
    end_time: int,
    submissions: List[Dict[str, Any]],
) -> Dict[str, Any]:
    by_problem: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for submission in submissions:
        problem = submission.get("problem", {})
        problem_key = f"{submission.get('contestId', 0)}-{problem.get('index', '')}"
        by_problem[problem_key].append(submission)

    solved_problems = []
    unsolved_problems = []
    upsolved_problems = []
    contest_tags = Counter()
    solved_ratings: List[int] = []
    ac_offsets: List[int] = []
    contest_wrong_attempts = 0

    for submissions_for_problem in by_problem.values():
        submissions_for_problem.sort(key=lambda item: item.get("creationTimeSeconds", 0))
        problem = submissions_for_problem[0].get("problem", {})
        wrong_during_contest = 0
        solved_in_contest = False
        upsolved = False
        first_ac_time = None

        for submission in submissions_for_problem:
            verdict = submission.get("verdict")
            ts = submission.get("creationTimeSeconds", 0)

            if verdict == "OK":
                first_ac_time = ts
                solved_in_contest = start_time <= ts <= end_time
                upsolved = ts > end_time
                break

            if ts <= end_time:
                wrong_during_contest += 1

        rating = problem.get("rating")
        tags = problem.get("tags", [])
        base_info = {
            "index": problem.get("index", ""),
            "name": problem.get("name", ""),
            "rating": rating,
            "tags": tags,
            "wrong_submissions": wrong_during_contest,
            "total_submissions": len(submissions_for_problem),
        }
        contest_wrong_attempts += wrong_during_contest

        if solved_in_contest:
            offset_mins = max(0, (first_ac_time - start_time) // 60) if first_ac_time else None
            base_info["first_ac_offset_mins"] = offset_mins
            solved_problems.append(base_info)
            if isinstance(rating, int):
                solved_ratings.append(rating)
            if offset_mins is not None:
                ac_offsets.append(offset_mins)
            contest_tags.update(tags)
        elif upsolved:
            upsolved_problems.append(base_info)
        else:
            unsolved_problems.append(base_info)

    attempted = len(by_problem)
    solved = len(solved_problems)
    upsolved_count = len(upsolved_problems)
    average_solved_rating = round(average(solved_ratings)) if solved_ratings else None
    first_ac = min(ac_offsets) if ac_offsets else None
    last_ac = max(ac_offsets) if ac_offsets else None
    pressure_score = clamp(60 + solved * 8 - contest_wrong_attempts * 4 + upsolved_count * 5)
    efficiency_score = clamp(45 + solved * 10 - contest_wrong_attempts * 5)

    strengths = []
    if solved >= 3:
        strengths.append("good conversion once warm")
    if upsolved_count >= 1:
        strengths.append("strong post-contest follow-through")
    if average_solved_rating and average_solved_rating >= contest.get("newRating", 0):
        strengths.append("comfort on problems at or above current level")

    issues = []
    if contest_wrong_attempts >= solved + 2:
        issues.append("too many wrong attempts before stabilizing")
    if attempted > solved + 2:
        issues.append("attempt spread was wider than conversion rate")
    if first_ac is not None and first_ac > 45:
        issues.append("slow start cost early momentum")

    headline = build_contest_headline(
        solved=solved,
        attempted=attempted,
        delta=contest.get("newRating", 0) - contest.get("oldRating", 0),
        issues=issues,
        strengths=strengths,
    )

    return {
        "contest_id": contest.get("contestId", 0),
        "contest_name": contest_name,
        "date": datetime.fromtimestamp(end_time, UTC).strftime("%Y-%m-%d"),
        "division": api.infer_division(contest_name),
        "rank": contest.get("rank", 0),
        "old_rating": contest.get("oldRating", 0),
        "new_rating": contest.get("newRating", 0),
        "delta": contest.get("newRating", 0) - contest.get("oldRating", 0),
        "problems_attempted": attempted,
        "problems_solved": solved,
        "problems_upsolved": upsolved_count,
        "accuracy_ratio": f"{solved}/{attempted}" if attempted else "0/0",
        "accuracy_percent": round((solved / attempted) * 100, 1) if attempted else 0,
        "wrong_submissions": contest_wrong_attempts,
        "avg_solved_rating": average_solved_rating,
        "first_ac_offset_mins": first_ac,
        "last_ac_offset_mins": last_ac,
        "solved_problems": solved_problems,
        "unsolved_problems": unsolved_problems,
        "upsolved_problems": upsolved_problems,
        "solved_tags": [tag for tag, _ in contest_tags.most_common(6)],
        "pressure_score": pressure_score,
        "efficiency_score": efficiency_score,
        "headline": headline,
        "strengths": strengths,
        "issues": issues,
    }


def build_contest_headline(
    solved: int,
    attempted: int,
    delta: int,
    issues: List[str],
    strengths: List[str],
) -> str:
    if delta >= 40:
        return f"Strong rating gain with {solved}/{attempted} conversion; {strengths[0] if strengths else 'the contest execution held up well'}."
    if delta < 0 and issues:
        return f"Rating slipped despite {solved}/{attempted}; the main drag was {issues[0]}."
    if strengths:
        return f"Stable contest with {solved}/{attempted}; {strengths[0]} stood out."
    return f"Mixed contest with {solved}/{attempted} solved and room to sharpen conversion."


@conditional_memoize(timeout=3600)
def build_deep_analysis(handle: str) -> Dict[str, Any]:
    user_info = api.get_user_info(handle)
    rating_history = api.get_rating_history(handle)
    problems = api.get_problem_history(handle)
    weekly_progress = api.get_weekly_solved_problems(handle, weeks=24)
    recent_contests = contest_analysis(handle, count=8)

    tag_counter = Counter()
    rated_problems = []
    solved_this_year = 0
    now = datetime.now(UTC)

    for problem in problems:
        tag_counter.update(problem.get("tags", []))
        if isinstance(problem.get("rating"), int):
            rated_problems.append(problem["rating"])
        solved_dt = datetime.strptime(problem["solved_at"], "%Y-%m-%d").replace(tzinfo=UTC)
        if (now - solved_dt).days <= 365:
            solved_this_year += 1

    current_rating = user_info["rating"]
    recent_deltas = [entry["delta"] for entry in rating_history[-5:]]
    long_deltas = [entry["delta"] for entry in rating_history[-20:]]
    active_weeks = sum(1 for week in weekly_progress if week["count"] > 0)
    average_weekly = round(average([week["count"] for week in weekly_progress]), 1)
    top_tags = [{"tag": tag, "count": count} for tag, count in tag_counter.most_common(8)]
    average_problem_rating = round(average(rated_problems)) if rated_problems else 0
    hardest_solved = max(rated_problems) if rated_problems else 0

    pressure_scores = [contest["pressure_score"] for contest in recent_contests]
    efficiency_scores = [contest["efficiency_score"] for contest in recent_contests]
    accuracy_scores = [contest["accuracy_percent"] for contest in recent_contests]
    avg_first_ac = average(
        [contest["first_ac_offset_mins"] for contest in recent_contests if contest["first_ac_offset_mins"] is not None]
    )
    avg_upsolves = average([contest["problems_upsolved"] for contest in recent_contests])

    skill_map = build_skill_map(top_tags, pressure_scores, efficiency_scores, average_problem_rating, avg_first_ac, avg_upsolves)
    strengths, focus_areas = derive_strengths_and_focus_areas(
        recent_contests=recent_contests,
        average_weekly=average_weekly,
        active_weeks=active_weeks,
        average_problem_rating=average_problem_rating,
        hardest_solved=hardest_solved,
        skill_map=skill_map,
        current_rating=current_rating,
    )

    overview = {
        "rating_trend_5": sum(recent_deltas),
        "rating_trend_20": sum(long_deltas),
        "average_weekly_solves": average_weekly,
        "active_weeks": active_weeks,
        "solved_this_year": solved_this_year,
        "average_problem_rating": average_problem_rating,
        "hardest_solved": hardest_solved,
        "contests_played": len(rating_history),
        "coach_score": clamp(
            current_rating / 28
            + average_weekly * 3
            + average(accuracy_scores) * 0.18
            + average(pressure_scores) * 0.16
            + avg_upsolves * 4
        ),
    }

    profile = {
        "handle": user_info["handle"],
        "rating": current_rating,
        "max_rating": user_info["maxRating"],
        "rank": user_info["rank"],
        "max_rank": user_info["maxRank"],
        "avatar": user_info["titlePhoto"] or user_info["avatar"],
        "registration_time": user_info["registrationTime"],
        "days_on_site": user_info["days_on_site"],
        "friend_of_count": user_info["friendOfCount"],
        "organization": user_info["organization"],
        "country": user_info["country"],
        "strengths": strengths,
        "focus_areas": focus_areas,
        "tag_mastery": top_tags,
    }

    training_plan = build_training_plan(
        profile=profile,
        overview=overview,
        recent_contests=recent_contests,
        skill_map=skill_map,
        top_tags=top_tags,
    )

    return {
        "profile": profile,
        "overview": overview,
        "rating_history": rating_history,
        "weekly_progress": weekly_progress,
        "recent_contests": recent_contests,
        "skill_map": skill_map,
        "training_plan": training_plan,
    }


def build_skill_map(
    top_tags: List[Dict[str, Any]],
    pressure_scores: List[int],
    efficiency_scores: List[int],
    average_problem_rating: int,
    avg_first_ac: float,
    avg_upsolves: float,
) -> List[Dict[str, Any]]:
    tag_lookup = {item["tag"]: item["count"] for item in top_tags}

    scores = {
        "speed": clamp(average(pressure_scores) - avg_first_ac * 0.35 + 18),
        "accuracy": clamp(average(efficiency_scores)),
        "depth": clamp(percentile_style_score(average_problem_rating, 800, 2200)),
        "problem_reading": clamp(72 - avg_first_ac * 0.45),
        "resilience": clamp(45 + avg_upsolves * 18),
    }

    skill_map = []
    for skill, mapped_tags in SKILL_BUCKETS.items():
        related_tag_weight = sum(tag_lookup.get(tag, 0) for tag in mapped_tags)
        adjusted_score = clamp(scores[skill] + related_tag_weight * 2.5)
        skill_map.append(
            {
                "skill": skill.replace("_", " ").title(),
                "score": adjusted_score,
                "related_tags": mapped_tags,
            }
        )

    return skill_map


def derive_strengths_and_focus_areas(
    recent_contests: List[Dict[str, Any]],
    average_weekly: float,
    active_weeks: int,
    average_problem_rating: int,
    hardest_solved: int,
    skill_map: List[Dict[str, Any]],
    current_rating: int,
) -> tuple[List[str], List[str]]:
    strengths = []
    focus_areas = []
    avg_accuracy = average([contest["accuracy_percent"] for contest in recent_contests])
    avg_upsolves = average([contest["problems_upsolved"] for contest in recent_contests])
    rating_gain = sum(contest["delta"] for contest in recent_contests[-5:])

    if average_weekly >= 8:
        strengths.append("practice volume is no longer the bottleneck")
    if avg_upsolves >= 1:
        strengths.append("you revisit hard problems instead of abandoning them")
    if hardest_solved >= current_rating + 200:
        strengths.append("you can already touch problems above your current rating band")
    if rating_gain > 0:
        strengths.append("recent contests show upward momentum")

    if avg_accuracy < 45:
        focus_areas.append("conversion is low once you branch into harder tasks")
    if active_weeks < 14:
        focus_areas.append("consistency drops too much from week to week")
    if average_problem_rating < max(900, current_rating - 100):
        focus_areas.append("practice depth is lagging behind rating ambition")
    weakest_skill = min(skill_map, key=lambda item: item["score"])
    focus_areas.append(f"{weakest_skill['skill'].lower()} is the weakest dimension right now")

    return strengths[:4], focus_areas[:4]


def build_training_plan(
    profile: Dict[str, Any],
    overview: Dict[str, Any],
    recent_contests: List[Dict[str, Any]],
    skill_map: List[Dict[str, Any]],
    top_tags: List[Dict[str, Any]],
) -> Dict[str, Any]:
    weakest = min(skill_map, key=lambda item: item["score"])
    strongest = max(skill_map, key=lambda item: item["score"])
    contest_issues = [issue for contest in recent_contests[:4] for issue in contest["issues"]]
    common_issue = Counter(contest_issues).most_common(1)[0][0] if contest_issues else "contest pacing"
    next_tag_targets = [item["tag"] for item in top_tags[:3]] or ["implementation", "greedy", "dp"]

    weekly_focus = [
        f"stabilize {weakest['skill'].lower()} through two focused practice blocks",
        f"protect {strongest['skill'].lower()} by keeping one confidence session",
        f"simulate one timed contest and review {common_issue}",
    ]
    drills = [
        f"Solve 4 problems in the {profile['rating'] - 100} to {profile['rating'] + 100} band with a 25-minute cap per problem.",
        f"Do one post-contest upsolve review centered on {', '.join(next_tag_targets)}.",
        "Keep a WA log: note the exact wrong assumption before reading editorials.",
    ]
    milestones = [
        f"Raise average weekly solves above {max(overview['average_weekly_solves'] + 2, 10):.0f}.",
        f"Push average solved difficulty from {overview['average_problem_rating']} to at least {overview['average_problem_rating'] + 100}.",
        "Finish the next contest with a cleaner first hour than the last three outings.",
    ]

    return {
        "weekly_focus": weekly_focus,
        "drills": drills,
        "milestones": milestones,
        "next_tag_targets": next_tag_targets,
    }


def ai_contest_prompt(handle: str, analysis: Dict[str, Any]) -> str:
    profile = analysis["profile"]
    overview = analysis["overview"]
    skill_map = analysis["skill_map"]
    recent_contests = analysis["recent_contests"][:5]
    training_plan = analysis["training_plan"]

    lines = [
        f"Handle: {handle}",
        f"Current rating: {profile['rating']} ({profile['rank']})",
        f"Max rating: {profile['max_rating']} ({profile['max_rank']})",
        f"Coach score: {overview['coach_score']}",
        f"Average weekly solves: {overview['average_weekly_solves']}",
        f"Average solved difficulty: {overview['average_problem_rating']}",
        f"Hardest solved problem rating: {overview['hardest_solved']}",
        f"Strengths: {', '.join(profile['strengths']) or 'N/A'}",
        f"Focus areas: {', '.join(profile['focus_areas']) or 'N/A'}",
        "",
        "Skill map:",
    ]

    for skill in skill_map:
        lines.append(f"- {skill['skill']}: {skill['score']}/100")

    lines.append("")
    lines.append("Recent contest notes:")
    for contest in recent_contests:
        lines.append(
            f"- {contest['contest_name']} | delta {contest['delta']} | solved {contest['problems_solved']}/{contest['problems_attempted']} "
            f"| accuracy {contest['accuracy_percent']}% | pressure {contest['pressure_score']} | efficiency {contest['efficiency_score']} "
            f"| issues: {', '.join(contest['issues']) or 'none'} | headline: {contest['headline']}"
        )

    lines.extend(
        [
            "",
            "Training plan:",
            *[f"- {item}" for item in training_plan["weekly_focus"]],
            *[f"- {item}" for item in training_plan["drills"]],
            "",
            "Write a deep coaching report with these sections:",
            "1. Performance identity",
            "2. What is holding the user back",
            "3. Contest behavior diagnosis",
            "4. One-week action plan",
            "5. A blunt but motivating closing note",
            "Use concrete references to the supplied metrics.",
        ]
    )

    return "\n".join(lines)
