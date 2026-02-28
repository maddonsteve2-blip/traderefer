import asyncio
import json
import os
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

async def scrape_geelong_trade(page, category_slug):
    url = f"https://www.serviceseeking.com.au/{category_slug}/vic/geelong"
    print(f"Scraping: {url}")
    
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        # Check if there are results
        # ServiceSeeking usually has a "Showing X of Y builders in Geelong" or similar
        # If no results, it might show "No results found" or similar
        
        # Give it a second to load any dynamic content
        await asyncio.sleep(2)
        
        # Extract businesses
        businesses = await page.evaluate("""() => {
            const results = [];
            // Target the business cards specifically
            const items = document.querySelectorAll('a[href^="/profile/"]');
            
            items.forEach(item => {
                const nameEl = item.querySelector('.business-name');
                const ratingEl = item.querySelector('.star-rating');
                const suburbEl = item.querySelector('.suburb-name');
                
                if (nameEl) {
                    results.push({
                        name: nameEl.innerText.trim(),
                        rating: ratingEl ? ratingEl.innerText.trim() : null,
                        suburb: suburbEl ? suburbEl.innerText.trim() : null,
                        url: item.href
                    });
                }
            });
            return results;
        }""")
        
        return businesses
    except Exception as e:
        print(f"Error scraping {category_slug}: {e}")
        return []

async def main():
    # Use the trade shortlist as prioritized categories
    categories_path = "scripts/trade_shortlist.json"
    if not os.path.exists(categories_path):
        print(f"Trade shortlist not found at {categories_path}. Falling back to all categories.")
        categories_path = "scripts/all_ss_categories.json"
        
    if not os.path.exists(categories_path):
        print("No categories file found.")
        return
        
    with open(categories_path, 'r') as f:
        all_categories = json.load(f)
        
    print(f"Loaded {len(all_categories)} categories from {categories_path}.")
    
    # Optional: Filter for specific trades if needed, but for now we'll process all as requested
    # We can use a progress file to resume
    progress_path = "scripts/scrape_progress.json"
    processed_categories = []
    if os.path.exists(progress_path):
        with open(progress_path, 'r') as f:
            progress = json.load(f)
            processed_categories = progress.get('processed', [])
            
    categories_to_scrape = [c for c in all_categories if c not in processed_categories]
    
    print(f"Total categories: {len(all_categories)}")
    print(f"Already processed: {len(processed_categories)}")
    print(f"Remaining: {len(categories_to_scrape)}")
    
    if not categories_to_scrape:
        print("All categories already processed.")
        return

    # For safety and to avoid blocking, we'll process in a loop with delays
    # We'll save results incrementally
    output_path = "scripts/scraped_geelong_ss_trades.json"
    all_businesses = []
    if os.path.exists(output_path):
        with open(output_path, 'r') as f:
            try:
                all_businesses = json.load(f)
            except:
                all_businesses = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        await stealth_async(page)
        
        # Limit the number of categories per run to avoid long execution times in one go
        # The user can run it multiple times to complete
        batch_limit = 50
        categories_this_run = categories_to_scrape[:batch_limit]
        
        for i, slug in enumerate(categories_this_run):
            print(f"[{i+1}/{len(categories_this_run)}] Category: {slug} (Overall {len(processed_categories) + i + 1}/{len(all_categories)})")
            businesses = await scrape_geelong_trade(page, slug)
            if businesses:
                print(f"  Found {len(businesses)} businesses")
                for b in businesses:
                    b['category_slug'] = slug
                all_businesses.extend(businesses)
                
                # Check for duplicates (by URL)
                seen_urls = set()
                unique_businesses = []
                for b in all_businesses:
                    if b['url'] not in seen_urls:
                        unique_businesses.append(b)
                        seen_urls.add(b['url'])
                all_businesses = unique_businesses
            else:
                print("  No businesses found or error.")
            
            processed_categories.append(slug)
            
            # Save progress incrementally
            with open(progress_path, 'w') as f:
                json.dump({'processed': processed_categories}, f, indent=2)
            
            with open(output_path, 'w') as f:
                json.dump(all_businesses, f, indent=2)
                
            # Wait a bit between requests
            await asyncio.sleep(3)
            
        print(f"Batch complete. Saved progress. Total businesses scraped so far: {len(all_businesses)}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
