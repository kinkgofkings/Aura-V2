import urllib.request

candidates = [
    'https://images.unsplash.com/photo-1444464666168-49b626d49cb0?w=800&q=80',
    'https://images.unsplash.com/photo-1518057111178-44a106bad636?w=800&q=80',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80',
    'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800&q=80',
    'https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80',
    'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&q=80',
    'https://images.unsplash.com/photo-1469598614039-ccfeb0a21111?w=800&q=80',
    'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&q=80'
]

for url in candidates:
    try:
        req = urllib.request.Request(url, method='HEAD')
        res = urllib.request.urlopen(req)
        print(f"OK: {url}")
    except Exception as e:
        print(f"FAIL: {url} - {e}")
