import json
import os

def filter_trades():
    categories_path = "scripts/all_ss_categories.json"
    if not os.path.exists(categories_path):
        print("Categories file not found.")
        return
        
    with open(categories_path, 'r') as f:
        all_categories = json.load(f)
        
    trades_keywords = [
        'plumber', 'electrician', 'painter', 'carpenter', 'fencer', 'bricklayer', 
        'plasterer', 'tiler', 'roofer', 'landscaper', 'gardener', 'handyman', 
        'cleaner', 'mechanic', 'arborist', 'locksmith', 'stonemason', 'paver', 
        'render', 'concreter', 'glaz', 'insulation', 'waterproof', 'demolition', 
        'earthmov', 'excavat', 'pest-control', 'antenna', 'appliance', 'automotive', 
        'floor', 'cabinet', 'joiner', 'built-in', 'builder', 'renovator', 'technician',
        'contractor', 'installation', 'repair', 'maintenance', 'maintenance-services',
        'fitting', 'removal', 'fixing', 'service', 'renovation', 'cladding', 'brick',
        'concrete', 'asbestos', 'asphalt', 'gate', 'fence', 'window', 'door', 'roof',
        'bathroom', 'kitchen', 'laundry', 'pool', 'spa', 'deck', 'patio', 'driveway',
        'plumbing', 'electrical', 'painting', 'fencing', 'gardening', 'landscaping',
        'cleaning', 'plastering', 'tiling', 'bricklaying', 'carpentry', 'builder',
        'earthworks', 'concreting', 'structural', 'scaffolding', 'welder', 'boilermaker',
        'blacksmith', 'glazier', 'glass', 'mirror', 'shutters', 'blinds', 'curtains',
        'awning', 'skylight', 'solar', 'ac-servicing', 'air-con', 'heating', 'cooling',
        'hvac', 'ventilation', 'duct', 'exhaust', 'antenna', 'cabling', 'security',
        'lock', 'key', 'iron', 'steel', 'metal', 'gas-fitting', 'hot-water', 'leak',
        'drain', 'pipe', 'sewage', 'tank', 'septic', 'waste', 'rubbish', 'junk',
        'delivery', 'removalist', 'transport', 'odd-jobs', 'labourer', 'bobcat',
        'excavator', 'foundations', 'slab', 'caulking', 'bagging', 'rendering',
        'pointing', 'cladding', 'plasterboard', 'gyprock', 'cornice', 'architrave',
        'skirting', 'moulding', 'upholstery', 'furniture-repair', 'assembly',
        'carpet', 'vinyl', 'timber', 'laminate', 'decking', 'paver', 'retaining-wall',
        'landscape', 'mowing', 'hedge', 'lawn', 'mulch', 'irrigation', 'sprinkler',
        'turf', 'pond', 'tree', 'stump', 'pest', 'exterminator', 'termite', 'cockroach',
        'rat', 'mouse', 'bird', 'bee', 'wasp', 'car-clean', 'car-wash', 'detailing'
    ]
    
    exclusion_keywords = [
        'lawyer', 'attorney', 'legal', 'accountant', 'bookkeeper', 'cpa', 'bas-agent', 
        'tax', 'financial', 'insurance', 'marketing', 'seo', 'web', 'digital', 
        'graphic', 'design', 'photography', 'videography', 'video', 'photo',
        'wedding', 'bridal', 'hair', 'makeup', 'beauty', 'nails', 'massage', 
        'health', 'medical', 'dental', 'doctor', 'nurse', 'coach', 'trainer', 
        'teaching', 'tutor', 'event', 'party', 'catering', 'celebrant', 'entertainment',
        'band', 'dj', 'musician', 'clown', 'magician', 'travel', 'holiday', 
        'it-consult', 'software', 'app-dev', 'data-entry', 'business-plan',
        'accounting', 'auditor', 'bankruptcy', 'criminal-law', 'family-law',
        'employment-law', 'photography', 'videography', 'illustrator', 'branding',
        'printing', 'promotional', 'translation', 'secretarial', 'admin',
        'marketing', 'advertising', 'consulting', 'coaching', 'lessons',
        'training', 'security-guard', 'investigator', 'process-server',
        'personal-shopper', 'tailor', 'dressmaker', 'cake', 'florist',
        'waiter', 'bartender', 'hosting', 'pet-minding', 'dog-walk',
        'nanny', 'babysit', 'childcare', 'elderly', 'tutoring', 'music-lessons',
        'fitness', 'yoga', 'pilates', 'gym', 'sports', 'martial-arts',
        'meditation', 'counseling', 'psychology', 'therapy', 'nutrition',
        'weight-loss', 'wellness', 'physio', 'chiropractic', 'osteopath',
        'acupuncture', 'remedial', 'spa-treatments', 'eyelash', 'piercing',
        'tattoo', 'tanning', 'waxing', 'facials'
    ]

    trade_shortlist = []
    
    for slug in all_categories:
        is_trade = False
        # Check if slug contains any trade keywords
        for kw in trades_keywords:
            if kw in slug:
                is_trade = True
                break
        
        # Double check with exclusions
        if is_trade:
            for ex in exclusion_keywords:
                # Be careful not to exclude "bathroom-design" if we want "bathroom"
                # But here we probably want to exclude "graphic-design"
                # So we check if the exclusion is the only thing or a major part
                if ex in slug:
                    # If it's a trade-like category that also has design (like kitchen-design)
                    # we might want to keep it.
                    if any(tkw in slug for tkw in ['kitchen', 'bathroom', 'interior', 'landscape', 'building', 'home']):
                        pass # Keep it
                    else:
                        is_trade = False
                        break
        
        if is_trade:
            trade_shortlist.append(slug)

    unique_trades = sorted(list(set(trade_shortlist)))
    print(f"Total categories: {len(all_categories)}")
    print(f"Filtered trades: {len(unique_trades)}")
    
    with open('scripts/trade_shortlist.json', 'w') as f:
        json.dump(unique_trades, f, indent=2)
        
    print("Saved to scripts/trade_shortlist.json")
    
    # Document the categorization
    with open('scripts/categorization_notes.md', 'w') as f:
        f.write("# ServiceSeeking Category Shortlisting\n\n")
        f.write("## Overview\n")
        f.write("To focus on trades and home/property services, we filtered the original list of 1088 categories down to a focused shortlist.\n\n")
        f.write(f"- **Original Categories**: {len(all_categories)}\n")
        f.write(f"- **Trade-Focused Shortlist**: {len(unique_trades)}\n\n")
        f.write("## Keywords Used for Filtering\n")
        f.write("### Inclusion Keywords:\n")
        f.write(", ".join(trades_keywords[:20]) + "... (and more)\n\n")
        f.write("### Exclusion Keywords:\n")
        f.write(", ".join(exclusion_keywords[:20]) + "... (and more)\n\n")
        f.write("## Usage\n")
        f.write("The script `scrape_geelong_ss.py` has been updated to use `trade_shortlist.json` to prioritize trades for the Geelong region.\n")

if __name__ == "__main__":
    filter_trades()
