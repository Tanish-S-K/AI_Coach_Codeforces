from cf_api import get_user_submissions
from analysis import analyze_user
from suggestor import suggest_problems

if __name__ == "__main__":
    handle = input("Enter your Codeforces handle: ")
    submissions = get_user_submissions(handle)
    stats = analyze_user(submissions)
    suggestions = suggest_problems(stats)
    print("\n=== Analysis ===")
    for tag, data in stats.items():
        print(f"{tag}: {data}")
    print("\n=== Suggested Problems ===")
    for prob in suggestions:
        print(f"{prob['name']} - {prob['url']}")
