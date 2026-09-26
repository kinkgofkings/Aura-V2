import urllib.request
import re
import urllib.parse

def get_id(query):
    url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
    try:
        html = urllib.request.urlopen(url).read().decode('utf-8')
        video_ids = re.findall(r"watch\?v=(\S{11})", html)
        # Filter for known bible project channel or just take the first
        if video_ids:
            return video_ids[0]
    except Exception as e:
        return str(e)
    return "Not found"

queries = [
    "Bible Project Character of God",
    "Bible Project How to Read the Bible",
    "Bible Project Water of Life",
    "Bible Project Spirit",
    "Bible Project The Prophets",
    "Bible Project Day of the Lord",
    "Bible Project Eternal Life",
    "Bible Project Love",
    "Bible Project Justice",
]

for q in queries:
    print(f"{q}: {get_id(q)}")
