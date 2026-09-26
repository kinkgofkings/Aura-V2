import urllib.request
import re
import urllib.parse

def get_id(query):
    url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
    try:
        html = urllib.request.urlopen(url).read().decode('utf-8')
        video_ids = re.findall(r"watch\?v=(\S{11})", html)
        if video_ids:
            return video_ids[0]
    except Exception as e:
        return str(e)
    return "Not found"

queries = [
    "Bible Project Genesis 12-50",
    "Bible Project Exodus",
    "Bible Project 1 & 2 Kings",
    "Bible Project Exile",
    "Bible Project Jesus Incarnation",
    "Bible Project Miracles",
    "Bible Project Sermon on the Mount",
    "Bible Project I AM",
    "Bible Project Sin",
    "Bible Project Atonement",
    "Bible Project Grace",
    "Bible Project New Creation",
    "Bible Project Holy Spirit",
    "Bible Project The Church",
    "Bible Project Heaven and Earth"
]

for q in queries:
    print(f"{q}: {get_id(q)}")
