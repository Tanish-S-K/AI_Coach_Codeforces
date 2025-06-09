from collections import defaultdict

def analyze_user(submissions):
    tag_stats = defaultdict(lambda: {'solved': 0, 'total': 0})
    for sub in submissions:
        if 'problem' in sub:
            problem = sub['problem']
            tags = problem.get('tags', [])
            for tag in tags:
                tag_stats[tag]['total'] += 1
                if sub['verdict'] == 'OK':
                    tag_stats[tag]['solved'] += 1
    tag_accuracy = {}
    for tag, stat in tag_stats.items():
        accuracy = (stat['solved'] / stat['total']) * 100 if stat['total'] > 0 else 0
        tag_accuracy[tag] = {
            'solved': stat['solved'],
            'total': stat['total'],
            'accuracy': round(accuracy, 2)
        }
    return tag_accuracy
