import requests
from bs4 import BeautifulSoup
import json
import re

def extract_categories():
    url = "https://www.serviceseeking.com.au/categories"
    print(f"Fetching {url}...")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for links that point to category pages
        # Usually they are in the main content area and follow a pattern
        # Based on the browser subagent, they are likely in alphabetical sections
        
        links = soup.find_all('a', href=True)
        slugs = []
        
        # Filter links that are category slugs (single path component)
        for link in links:
            href = link['href']
            # Match /slug but not /vic/something or /blog or /login
            match = re.match(r'^/([^/]+)$', href)
            if match:
                slug = match.group(1)
                # Filter out known non-category slugs
                if slug not in ['categories', 'login', 'signup', 'how-it-works', 'about-us', 'contact-us', 'privacy', 'terms', 'blog', 'help']:
                    slugs.append(slug)
        
        unique_slugs = sorted(list(set(slugs)))
        print(f"Found {len(unique_slugs)} unique slugs.")
        
        with open('scripts/all_ss_categories.json', 'w') as f:
            json.dump(unique_slugs, f, indent=2)
            
        print("Saved to scripts/all_ss_categories.json")
        return unique_slugs
        
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    extract_categories()
