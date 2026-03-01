export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Route protection is handled by proxy.ts middleware.
    // The root /onboarding choice page is blocked for complete users there.
    // Sub-routes (/onboarding/business, /onboarding/referrer) are always
    // accessible so users can create a missing backend profile.
    return <>{children}</>
}
