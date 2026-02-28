import requests
import gzip
import io
import xml.etree.ElementTree as ET

def get_xml_urls(url, limit=50):
    print(f"Fetching: {url}")
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=20)
        response.raise_for_status()
        with gzip.GzipFile(fileobj=io.BytesIO(response.content)) as f:
            content = f.read()
        root = ET.fromstring(content)
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        urls = [loc.text for loc in root.findall('.//s:loc', ns)]
        return urls[:limit], len(urls)
    except Exception as e:
        return [f"Error: {e}"], 0

targets = {
    "Profiles": "https://www.serviceseeking.com.au/sitemaps/profile/profiles.xml.gz",
    "Keywords": "https://www.serviceseeking.com.au/sitemaps/seo_snippet_pages/keywords.xml.gz",
    "Suburbs": "https://www.serviceseeking.com.au/sitemaps/job_requests/suburbs.xml.gz",
    "CatSuburbs": "https://www.serviceseeking.com.au/sitemaps/job_requests/categories_and_suburbs.xml.gz"
}

summary = {}
for name, url in targets.items():
    urls, total = get_xml_urls(url)
    summary[name] = {"total": total, "samples": urls}

import json
print(json.dumps(summary, indent=2))
