import gzip
import xml.etree.ElementTree as ET
import os
import json
import re

def decompress_and_extract_urls(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return []
    
    urls = []
    try:
        with gzip.open(file_path, 'rb') as f:
            content = f.read()
            # Basic XML parsing to extract <loc> tags
            root = ET.fromstring(content)
            # Handle namespaces if present
            ns = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            for loc in root.findall('.//ns:loc', ns):
                urls.append(loc.text)
            
            # If no namespace works, try without
            if not urls:
                for loc in root.findall('.//loc'):
                    urls.append(loc.text)
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        # Try a regex fallback if XML parsing fails
        try:
            with gzip.open(file_path, 'rb') as f:
                text = f.read().decode('utf-8', errors='ignore')
                urls = re.findall(r'<loc>(.*?)</loc>', text)
        except:
            pass
            
    return urls

def main():
    base_dir = r"c:\Users\61479\Downloads\serviceseeking"
    files = [
        "categories.xml.gz",
        "categories_and_suburbs.xml.gz",
        "keywords (1).xml.gz",
        "parent.xml.gz",
        "profiles.xml.gz",
        "suburbs.xml.gz"
    ]
    
    all_extracted_data = {}
    
    for filename in files:
        path = os.path.join(base_dir, filename)
        print(f"Processing {filename}...")
        urls = decompress_and_extract_urls(path)
        all_extracted_data[filename] = {
            "count": len(urls),
            "sample": urls[:10]
        }
        
        # If it's the keywords file, let's try to extract unique categories/slugs
        if "keywords" in filename or "categories" in filename:
            # Extract the last part of the URL which is often the category slug
            slugs = set()
            for url in urls:
                # Most URLs are like https://www.serviceseeking.com.au/plumbers
                # or https://www.serviceseeking.com.au/plumbers/vic/geelong
                parts = url.split('/')
                if len(parts) > 3:
                    slug = parts[3]
                    if slug not in ['sitemaps', 'profile', 'job_requests', 'articles', 'reviews']:
                        slugs.add(slug)
            
            all_extracted_data[filename]["unique_slugs_count"] = len(slugs)
            all_extracted_data[filename]["slugs_sample"] = list(slugs)[:20]
            
            # Save the full list of slugs for this file
            with open(f"scripts/extracted_slugs_{filename.replace(' ', '_')}.json", 'w') as sf:
                json.dump(list(slugs), sf, indent=2)

    with open("scripts/sitemap_extraction_summary.json", 'w') as f:
        json.dump(all_extracted_data, f, indent=2)
    
    print("Done. Summary saved to scripts/sitemap_extraction_summary.json")

if __name__ == "__main__":
    main()
