"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"

export async function completeOnboarding(role: "business" | "referrer") {
    const { userId } = await auth()
    if (!userId) return { error: "Not authenticated" }

    try {
        const client = await clerkClient()
        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                onboardingComplete: true,
                role,
            },
        })

        return { success: true }
    } catch (err) {
        console.error("Clerk metadata update error:", err)
        return { error: "Failed to complete onboarding. Please try again." }
    }
}
