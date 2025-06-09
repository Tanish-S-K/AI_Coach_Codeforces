import requests

def get_user_submissions(handle):
    url = f"https://codeforces.com/api/user.status?handle={handle}&from=1&count=1000"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception("Failed to fetch data from Codeforces.")
    data = response.json()
    return data['result']
