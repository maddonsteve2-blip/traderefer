import asyncio
import json
import os
import re
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

async def scrape_google_maps(queries, output_file="scraped_businesses.json"):
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        await stealth_async(page)

        all_results = []
        if os.path.exists(output_file):
            try:
                with open(output_file, 'r') as f:
                    all_results = json.load(f)
            except:
                pass

        seen_names = {res['name'] for res in all_results if 'name' in res}

        for query in queries:
            print(f"\n--- Searching for: {query} ---")
            search_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}?hl=en"
            await page.goto(search_url)
            
            # Handle cookies/consent if it appears
            try:
                consent_btn = page.locator('button[aria-label="Accept all"]')
                if await consent_btn.is_visible(timeout=3000):
                    await consent_btn.click()
                    print("Accepted consent.")
            except:
                pass

            # Wait for results or empty state
            try:
                # Give it a bit more time for the feed to appear
                await page.wait_for_selector('div[role="feed"]', timeout=15000)
            except:
                print(f"No results feed found for '{query}'. Might be a single-result page or no matches.")
                # Check if it's a single result page (direct view)
                if await page.locator('h1.DUwDvf').is_visible(timeout=2000):
                    print("Single result page detected.")
                    # Handle single result if needed, but for now we focus on bulk
                continue

            # Scroll logic to load more results
            print("Scrolling to load more results...")
            prev_len = 0
            scroll_attempts = 0
            while scroll_attempts < 10:
                # Find the feed element to scroll
                await page.evaluate('''
                    const feed = document.querySelector('div[role="feed"]');
                    if (feed) {
                        feed.scrollTop = feed.scrollHeight;
                    }
                ''')
                await asyncio.sleep(3)
                current_items = await page.query_selector_all('div[role="article"]')
                if len(current_items) == prev_len:
                    scroll_attempts += 1
                else:
                    scroll_attempts = 0
                prev_len = len(current_items)
                print(f"  Loaded {prev_len} items...")
                if prev_len > 100:
                    break
            
            items = await page.query_selector_all('div[role="article"]')
            print(f"Processing {len(items)} items...")

            for item in items:
                try:
                    name_attr = await item.get_attribute("aria-label")
                    if not name_attr or name_attr in seen_names:
                        continue
                    
                    # Extract text content which contains most details
                    text_content = await item.inner_text()
                    
                    # Website link
                    website = ""
                    website_el = await item.query_selector('a[aria-label*="Website"]')
                    if website_el:
                        website = await website_el.get_attribute('href')

                    # Phone numbers (Australian format)
                    phone = ""
                    phone_match = re.search(r'(\+61|0)[2-478] \d{4} \d{4}|(\+61|0)4\d{2} \d{3} \d{3}|(1300|1800) \d{3} \d{3}', text_content)
                    if phone_match:
                        phone = phone_match.group(0)

                    # Rating and reviews
                    rating = ""
                    reviews = "0"
                    
                    # Google Maps list uses labels like "4.5 stars 123 Reviews"
                    aria_label = await item.evaluate('el => el.getAttribute("aria-label")')
                    # Sometimes the rating is in a nested span
                    rating_el = await item.query_selector('span[aria-label*="stars"]')
                    if rating_el:
                        r_text = await rating_el.get_attribute('aria-label')
                        r_match = re.search(r'([\d.]+)', r_text)
                        if r_match:
                            rating = r_match.group(1)
                    
                    reviews_el = await item.query_selector('span[aria-label*="reviews"]')
                    if reviews_el:
                        rev_text = await reviews_el.get_attribute('aria-label')
                        rev_match = re.search(r'([\d,]+)', rev_text)
                        if rev_match:
                            reviews = rev_match.group(1).replace(',', '')

                    # Simple heuristic for category and address from the text lines
                    lines = [line.strip() for line in text_content.split('\n') if line.strip()]
                    category = ""
                    address = ""
                    
                    if len(lines) > 1:
                        # Usually: Name, Rating/Category, Address...
                        # If the second line has stars, category is usually part of it or next line
                        if "stars" in lines[1].lower() or re.search(r'[\d.]+', lines[1]):
                            category = lines[2] if len(lines) > 2 else ""
                            address = lines[3] if len(lines) > 3 else ""
                        else:
                            category = lines[1]
                            address = lines[2] if len(lines) > 2 else ""

                    business_data = {
                        "name": name_attr,
                        "category": category,
                        "address": address,
                        "phone": phone,
                        "website": website,
                        "rating": rating,
                        "reviews": reviews,
                        "source_query": query
                    }
                    
                    all_results.append(business_data)
                    seen_names.add(name_attr)
                    
                except Exception as e:
                    pass

            # Update output file after each query
            with open(output_file, 'w') as f:
                json.dump(all_results, f, indent=2)
            print(f"Total results captured so far: {len(all_results)}")

        await browser.close()
        print(f"\nScraping finished. Results are in {output_file}")

if __name__ == "__main__":
    # Test with a small set of queries
    suburbs = ["Geelong", "Belmont", "Highton"]
    trades = ["Plumber", "Electrician"]
    
    queries = [f"{t} in {s}, VIC" for t in trades for s in suburbs]
    
    output_path = os.path.join(os.getcwd(), "scraped_businesses.json")
    asyncio.run(scrape_google_maps(queries, output_path))
