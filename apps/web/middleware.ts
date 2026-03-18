import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { LOCATION_REDIRECTS } from "@/lib/location-redirects";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/login(.*)",
    "/register(.*)",
    "/signup(.*)",
    "/join(.*)",
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
    "/ingest(.*)",
    "/sitemap.xml",
    "/sitemaps(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isOnboardingRootOnly = createRouteMatcher(["/onboarding"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
    const pathname = req.nextUrl.pathname;

    // 0a. Location 301 redirects (old → corrected URLs) - handle before auth
    if (pathname.startsWith("/local/")) {
        // Check exact path match first
        const redirectTo = LOCATION_REDIRECTS[pathname];
        if (redirectTo) {
            const url = req.nextUrl.clone();
            url.pathname = redirectTo;
            return NextResponse.redirect(url, 301);
        }
        // Also handle /local/state/city/suburb/trade paths where the base suburb path has a redirect
        const segments = pathname.split("/").filter(Boolean); // ["local", state, city, suburb, ...]
        if (segments.length >= 4) {
            const basePath = `/${segments.slice(0, 4).join("/")}`;
            const baseRedirect = LOCATION_REDIRECTS[basePath];
            if (baseRedirect) {
                const remaining = segments.slice(4).join("/");
                const url = req.nextUrl.clone();
                url.pathname = remaining ? `${baseRedirect}/${remaining}` : baseRedirect;
                return NextResponse.redirect(url, 301);
            }
        }
    }

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
        '/claim(.*)',
        '/api/backend(.*)',
        '/api/stripe(.*)',
        // Exclude: /, /b/*, /local/*, /top/*, /businesses*, /categories*, etc.
        // These routes have export const revalidate = 3600 and must not be touched by Clerk
    ],
};
