"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"

export async function completeOnboarding(role: "business" | "referrer", businessSlug?: string) {
    const { userId } = await auth()
    if (!userId) return { error: "Not authenticated" }

    try {
        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        const existing = (user.publicMetadata.roles as string[] | undefined) ?? []
        const roles = Array.from(new Set([...existing, role]))

        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                onboardingComplete: true,
                role,
                roles,
                ...(businessSlug ? { businessSlug } : {}),
            },
        })

        return { success: true }
    } catch (err) {
        console.error("Clerk metadata update error:", err)
        return { error: "Failed to complete onboarding. Please try again." }
    }
}
