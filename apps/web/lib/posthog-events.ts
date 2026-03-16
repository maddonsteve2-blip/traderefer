/**
 * PostHog Event Tracking for OpenClaw SEO Analysis
 * Phase 1: Essential events for SEO revenue attribution
 */

import posthog from 'posthog-js';

// ============================================================================
// PHASE 1: ESSENTIAL EVENTS (Must-Have)
// ============================================================================

/**
 * Track enhanced page view with SEO context
 * Call this on every page load to correlate GSC data with user behavior
 */
export function trackPageView(params: {
  pageUrl: string;
  pageTitle: string;
  pageType: 'local' | 'business' | 'home' | 'blog' | 'category' | 'other';
  state?: string;
  city?: string;
  suburb?: string;
  tradeCategory?: string;
  serviceType?: string;
}) {
  const referrer = typeof document !== 'undefined' ? document.referrer : '';
  const isGoogleOrganic = referrer.includes('google.com') && !referrer.includes('ad');

  posthog.capture('page_view', {
    // Standard
    page_url: params.pageUrl,
    page_title: params.pageTitle,
    
    // SEO-specific
    referrer_domain: referrer,
    is_google_organic: isGoogleOrganic,
    gsc_landing_page: isGoogleOrganic, // Flag for GSC correlation
    
    // Content categorization
    page_type: params.pageType,
    state: params.state,
    city: params.city,
    suburb: params.suburb,
    trade_category: params.tradeCategory,
    service_type: params.serviceType,
  });
}

/**
 * Track business signup completion
 * This is a primary conversion event for SEO attribution
 */
export function trackBusinessSignup(params: {
  businessId: string;
  businessName: string;
  tradeCategory: string;
  state: string;
  suburb: string;
  abnVerified: boolean;
  signupDurationSeconds?: number;
  sourcePage?: string;
}) {
  posthog.capture('business_signup_completed', {
    business_id: params.businessId,
    business_name: params.businessName,
    trade_category: params.tradeCategory,
    state: params.state,
    suburb: params.suburb,
    abn_verified: params.abnVerified,
    signup_duration_seconds: params.signupDurationSeconds,
    source_page: params.sourcePage,
  });
}

/**
 * Track referral submission (core transaction)
 * This is THE money event - tracks when a referral actually happens
 */
export function trackReferralSubmitted(params: {
  referralId: string;
  tradeCategory: string;
  suburb: string;
  state: string;
  jobValueEstimate?: string;
  matchedBusinesses: number;
  urgency?: 'emergency' | 'standard' | 'planning';
  sourcePage: string;
}) {
  posthog.capture('referral_submitted', {
    referral_id: params.referralId,
    trade_category: params.tradeCategory,
    suburb: params.suburb,
    state: params.state,
    job_value_estimate: params.jobValueEstimate,
    matched_businesses: params.matchedBusinesses,
    urgency: params.urgency,
    source_page: params.sourcePage,
  });
}

// ============================================================================
// PHASE 2: ENGAGEMENT EVENTS (High Value)
// ============================================================================

/**
 * Track content engagement (scroll depth + time)
 * Shows if content matches search intent
 */
export function trackContentEngaged(params: {
  scrollDepth: number; // percentage
  timeOnPage: number; // seconds
  wordCountRead?: number;
}) {
  posthog.capture('content_engaged', {
    scroll_depth: params.scrollDepth,
    time_on_page: params.timeOnPage,
    word_count_read: params.wordCountRead,
  });
}

/**
 * Track business listing viewed
 * Shows which business profiles get attention
 */
export function trackBusinessListingViewed(params: {
  businessId: string;
  businessName: string;
  positionInList?: number;
  source: 'local_search_results' | 'category_page' | 'direct' | 'other';
}) {
  posthog.capture('business_listing_viewed', {
    business_id: params.businessId,
    business_name: params.businessName,
    position_in_list: params.positionInList,
    source: params.source,
  });
}

/**
 * Track business contact action
 * Micro-conversion - shows intent
 */
export function trackBusinessContacted(params: {
  businessId: string;
  businessName: string;
  contactMethod: 'phone' | 'email' | 'website';
  isMobile: boolean;
}) {
  posthog.capture('business_contacted', {
    business_id: params.businessId,
    business_name: params.businessName,
    contact_method: params.contactMethod,
    is_mobile: params.isMobile,
  });
}

/**
 * Track quote request
 * High-intent action
 */
export function trackQuoteRequested(params: {
  businessId: string;
  businessName: string;
  jobType: string;
  urgency?: 'same_day' | 'this_week' | 'flexible';
}) {
  posthog.capture('quote_requested', {
    business_id: params.businessId,
    business_name: params.businessName,
    job_type: params.jobType,
    urgency: params.urgency,
  });
}

// ============================================================================
// PHASE 3: SEARCH & FILTER EVENTS (Content Gaps)
// ============================================================================

/**
 * Track on-site search
 * CRITICAL: Shows content gaps - what people search for but you don't have
 */
export function trackSearchPerformed(params: {
  query: string;
  resultsCount: number;
  filtersApplied?: string[];
}) {
  posthog.capture('search_performed', {
    query: params.query,
    results_count: params.resultsCount,
    filters_applied: params.filtersApplied,
  });
}

/**
 * Track filter application
 * Shows what users are looking for
 */
export function trackFilterApplied(params: {
  filterType: 'trade_category' | 'state' | 'suburb' | 'verified_only' | 'available_now';
  filterValue: string;
  resultsBefore: number;
  resultsAfter: number;
}) {
  posthog.capture('filter_applied', {
    filter_type: params.filterType,
    filter_value: params.filterValue,
    results_before: params.resultsBefore,
    results_after: params.resultsAfter,
  });
}

/**
 * Track category exploration
 * Shows user journey through trades
 */
export function trackCategoryExplored(params: {
  category: string;
  tradesViewed: string[];
  locationSet?: string;
}) {
  posthog.capture('category_explored', {
    category: params.category,
    trades_viewed: params.tradesViewed,
    location_set: params.locationSet,
  });
}

// ============================================================================
// PHASE 4: MICRO-CONVERSIONS (Intent Signals)
// ============================================================================

/**
 * Track calculator usage
 * Shows engagement with tools
 */
export function trackCalculatorUsed(params: {
  sliderValue: number;
  estimatedEarnings: number;
  tradeCategory?: string;
}) {
  posthog.capture('calculator_used', {
    slider_value: params.sliderValue,
    estimated_earnings: params.estimatedEarnings,
    trade_category: params.tradeCategory,
  });
}

/**
 * Track verification badge click
 * Trust signal interaction
 */
export function trackVerificationBadgeClicked(params: {
  badgeType: 'abn_verified' | 'licensed' | 'insured' | 'background_checked';
  businessId: string;
}) {
  posthog.capture('verification_badge_clicked', {
    badge_type: params.badgeType,
    business_id: params.businessId,
  });
}

/**
 * Track review read
 * Shows trust-building behavior
 */
export function trackReviewRead(params: {
  businessId: string;
  reviewRating: number;
  reviewReadCount: number;
}) {
  posthog.capture('review_read', {
    business_id: params.businessId,
    review_rating: params.reviewRating,
    review_read_count: params.reviewReadCount,
  });
}

/**
 * Track business comparison
 * High-intent behavior
 */
export function trackBusinessCompared(params: {
  businessIds: string[];
  comparisonDuration: number; // seconds
}) {
  posthog.capture('business_compared', {
    business_ids: params.businessIds,
    comparison_duration: params.comparisonDuration,
  });
}

// ============================================================================
// HELPER: Auto-detect page type from URL
// ============================================================================

export function detectPageType(pathname: string): {
  pageType: 'local' | 'business' | 'home' | 'blog' | 'category' | 'other';
  state?: string;
  suburb?: string;
  tradeCategory?: string;
} {
  // Home page
  if (pathname === '/') {
    return { pageType: 'home' };
  }

  // Business profile: /b/[slug]
  if (pathname.startsWith('/b/')) {
    return { pageType: 'business' };
  }

  // Local page: /local/[state]/[city]/[suburb]/[trade]/[service]
  if (pathname.startsWith('/local/')) {
    const parts = pathname.split('/').filter(Boolean);
    return {
      pageType: 'local',
      state: parts[1]?.toUpperCase(),
      suburb: parts[3],
      tradeCategory: parts[4],
    };
  }

  // Blog
  if (pathname.startsWith('/blog/')) {
    return { pageType: 'blog' };
  }

  // Category pages
  if (pathname.startsWith('/trades/') || pathname.startsWith('/categories/')) {
    return { pageType: 'category' };
  }

  return { pageType: 'other' };
}

// ============================================================================
// SCROLL DEPTH TRACKER
// ============================================================================

let scrollDepthTracked = false;
let pageLoadTime = 0;

export function initScrollDepthTracking() {
  if (typeof window === 'undefined') return;

  scrollDepthTracked = false;
  pageLoadTime = Date.now();

  const handleScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    // Track 75% scroll depth once per page
    if (scrollPercent >= 75 && !scrollDepthTracked) {
      scrollDepthTracked = true;
      const timeOnPage = Math.round((Date.now() - pageLoadTime) / 1000);
      
      trackContentEngaged({
        scrollDepth: scrollPercent,
        timeOnPage,
      });
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Cleanup
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}
