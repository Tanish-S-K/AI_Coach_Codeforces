import requests

def suggest_problems(tag_stats):
    weak_tags = sorted(tag_stats.items(), key=lambda x: x[1]['accuracy'])[:3]
    weak_tag_names = [tag[0] for tag in weak_tags]
    response = requests.get("https://codeforces.com/api/problemset.problems")
    problems = response.json()['result']['problems']
    suggestions = []
    for prob in problems:
        if any(tag in prob.get('tags', []) for tag in weak_tag_names):
            suggestions.append({
                'name': f"{prob['contestId']}-{prob['index']}",
                'url': f"https://codeforces.com/problemset/problem/{prob['contestId']}/{prob['index']}"
            })
        if len(suggestions) >= 10:
            break
    return suggestions
