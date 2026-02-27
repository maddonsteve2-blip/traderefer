import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getPostHogClient } from "@/lib/posthog-server";

const zai = createOpenAI({
    apiKey: process.env.ZAI_API_KEY,
    baseURL: "https://api.z.ai/api/coding/paas/v4",
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { conversation } = body;

        // Detect if this is a tweak vs a fresh generation
        const isTweak = conversation.some((m: { role: string; content: string }) =>
            m.role === 'system' && m.content.includes('profile editor')
        );

        const { text } = await generateText({
            model: zai.chat("glm-5"),
            messages: conversation,
        });

        // Track server-side profile generation
        const posthog = getPostHogClient();
        posthog.capture({
            distinctId: 'server',
            event: 'ai_profile_generated',
            properties: {
                is_tweak: isTweak,
                conversation_length: conversation.length,
            }
        });

        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return Response.json(parsed);
            } catch {
                // If JSON parse fails, return the raw text
                return Response.json({ raw: text });
            }
        }

        return Response.json({ raw: text });
    } catch (err: any) {
        console.error("AI generate-profile error:", err);
        return Response.json({ error: err.message || "AI generation failed" }, { status: 500 });
    }
}
