import requests
import gzip
import io
import xml.etree.ElementTree as ET

sitemaps = [
    "https://www.serviceseeking.com.au/sitemaps/seo_snippet_pages/keywords.xml.gz",
    "https://www.serviceseeking.com.au/sitemaps/job_requests/parent.xml.gz",
    "https://www.serviceseeking.com.au/sitemaps/job_requests/suburbs.xml.gz",
    "https://www.serviceseeking.com.au/sitemaps/job_requests/categories_and_suburbs.xml.gz",
    "https://www.serviceseeking.com.au/sitemaps/job_requests/categories.xml.gz",
    "https://www.serviceseeking.com.au/sitemaps/main/sitemap.xml.gz",
    "https://www.serviceseeking.com.au/sitemaps/main/general.xml.gz",
    "https://www.serviceseeking.com.au/sitemaps/profile/profiles.xml.gz"
]

def analyze_sitemap(url):
    print(f"\n--- Analyzing Sitemap: {url} ---")
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        response.raise_for_status()
        
        with gzip.GzipFile(fileobj=io.BytesIO(response.content)) as f:
            content = f.read()
            
        # Parse XML
        root = ET.fromstring(content)
        
        # Sitemaps can be sitemapindex or urlset
        # Extract namespaces
        ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        urls = []
        if root.tag.endswith('sitemapindex'):
            for sitemap in root.findall('s:sitemap', ns):
                loc = sitemap.find('s:loc', ns)
                if loc is not None:
                    urls.append(loc.text)
            print(f"Found {len(urls)} sub-sitemaps in index.")
        elif root.tag.endswith('urlset'):
            for url_el in root.findall('s:url', ns):
                loc = url_el.find('s:loc', ns)
                if loc is not None:
                    urls.append(loc.text)
            print(f"Found {len(urls)} URLs in set.")
            
        print("Sample URLs:")
        for u in urls[:10]:
            print(f"  {u}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    for s in sitemaps:
        analyze_sitemap(s)
