import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

const zai = createAnthropic({
    apiKey: process.env.ZAI_API_KEY,
    baseURL: "https://api.z.ai/api/coding/paas/v4/",
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { conversation } = body;

        const { text } = await generateText({
            model: zai("claude-sonnet-4-20250514"),
            messages: conversation,
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
