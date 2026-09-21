from .ingestion import load_url
def classify(q):
 q=q.lower()
 if 'http://' in q or 'https://' in q or 'latest news' in q:return 'web'
 if any(x in q for x in ['sql','database','count rows']):return 'sql'
 return 'rag'
def web(url):return load_url(url)
