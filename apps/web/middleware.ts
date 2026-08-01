import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/login(.*)",
    "/register(.*)",
    "/signup(.*)",
    "/join(.*)",
    "/claim(.*)",
    "/b/(.*)",
    "/businesses(.*)",
    "/contact(.*)",
    "/privacy(.*)",
    "/terms(.*)",
    "/support(.*)",
    "/leads(.*)",
    "/team(.*)",
    "/local(.*)",
    "/trades(.*)",
    "/categories(.*)",
    "/locations(.*)",
    "/top(.*)",
    "/api/webhooks(.*)",
    "/api/ai(.*)",
    "/api/enrich-business(.*)",
    // Anonymous-by-design backend endpoints (FastAPI takes only a db
    // dependency for these): the quote form, the claim flow on every
    // profile, and delist requests. Without these exemptions the Clerk
    // gate 307'd anonymous POSTs to /login and silently dropped every
    // lead/claim from logged-out visitors (found in QA 2026-06-12).
    "/api/backend/website-quotes(.*)",
    "/api/backend/auth/status",
    "/api/backend/business/(.*)/claim(.*)",
    "/api/backend/business/(.*)/delist",
    "/ingest(.*)",
    "/sitemap.xml",
    "/sitemaps(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isOnboardingRootOnly = createRouteMatcher(["/onboarding"]);

// NOTE: the old LOCATION_REDIRECTS block that lived here never ran — the
// config.matcher below excludes /local entirely. Wrong-city URLs now 308 at
// render time via getCanonicalCitySlug (lib/suburb-cities.ts) in the
// /local suburb/trade/job pages (audit 2026-06-12 §B).
export default clerkMiddleware(async (auth, req: NextRequest) => {
    // 1. Public routes: always accessible, no auth needed
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

    // 2. Private routes: call auth() only when needed
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    // 2. Not signed in on a private route → redirect to sign-in
    if (!userId) {
        return redirectToSignIn({ returnBackUrl: req.url });
    }

    const onboardingComplete = sessionClaims?.metadata?.onboardingComplete;

    // 3. Signed in but onboarding NOT complete
    if (!onboardingComplete) {
        // Already on onboarding page → let them through
        if (isOnboardingRoute(req)) {
            return NextResponse.next();
        }
        // Anywhere else → redirect to onboarding
        return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // 4. Signed in AND onboarding IS complete → only block the root /onboarding choice page
    // Allow /onboarding/business and /onboarding/referrer so users can create a missing profile
    if (onboardingComplete && isOnboardingRootOnly(req)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 5. Authenticated + onboarded + normal route → proceed
    return NextResponse.next();
});

export const config = {
    matcher: [
        // Only run Clerk middleware on authenticated routes
        // Exclude all public routes so they can be cached by Vercel ISR
        '/dashboard(.*)',
        '/settings(.*)',
        '/admin(.*)',
        '/onboarding(.*)',
        '/api/backend(.*)',
        '/api/stripe(.*)',
        // Exclude: /, /b/*, /local/*, /top/*, /businesses*, /categories*, etc.
        // These routes have export const revalidate = 3600 and must not be touched by Clerk
    ],
};
