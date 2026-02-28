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
    "/api/webhooks(.*)",
    "/api/ai(.*)",
    "/ingest(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    // 1. Public routes: always accessible
    if (isPublicRoute(req)) {
        return NextResponse.next();
    }

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

    // 4. Signed in AND onboarding IS complete → don't let them revisit onboarding
    if (onboardingComplete && isOnboardingRoute(req)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 5. Authenticated + onboarded + normal route → proceed
    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)",
        "/(api|trpc)(.*)",
    ],
};
