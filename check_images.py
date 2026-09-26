import urllib.request
covers = [
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=80',
    'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80',
    'https://images.unsplash.com/photo-1518991669955-9c7e78ec80ca?w=800&q=80',
    'https://images.unsplash.com/photo-1473621038935-7fb5566f12de?w=800&q=80',
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
    'https://images.unsplash.com/photo-1438012940875-4f38eb488427?w=800&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953eb1b5ae?w=800&q=80',
    'https://images.unsplash.com/photo-1469598614039-ccfeb0a21111?w=800&q=80',
    'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&q=80',
    'https://images.unsplash.com/photo-1436891620584-47fd0e565afb?w=800&q=80',
    'https://images.unsplash.com/photo-1544427920-c49ccca8a056?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&auto=format&fit=crop'
]

for url in covers:
    try:
        req = urllib.request.Request(url, method='HEAD')
        res = urllib.request.urlopen(req)
        print(f"OK: {url}")
    except Exception as e:
        print(f"FAIL: {url} - {e}")
