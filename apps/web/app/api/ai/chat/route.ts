import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

const zai = createAnthropic({
    apiKey: process.env.ZAI_API_KEY,
    baseURL: "https://api.z.ai/api/coding/paas/v4/",
});

export async function POST(req: Request) {
    try {
        const { messages, business_name, trade_category, suburb } = await req.json();

        const systemPrompt = `You are a friendly Australian onboarding assistant for TradeRefer — a platform that connects tradies with referrers who send them customers.

Your job is to have a quick, natural chat with a business owner to learn enough about their business to write an amazing profile. You're chatting with the owner of "${business_name}", a ${trade_category} business based in ${suburb}, VIC (Geelong region).

RULES:
- Ask ONE question at a time. Keep it conversational and casual — you're chatting with a tradie, not writing an essay.
- Use Australian English and keep it friendly. No corporate speak.
- You need to learn these things (ask about them naturally, not all at once):
  1. How long they've been in business
  2. What they specialise in (their bread and butter work)
  3. What makes them different from competitors
  4. The types of services they offer
  5. Anything they're proud of (awards, guarantees, quick response, etc.)
- After you've gathered enough info (usually 3-5 questions), tell them you have everything you need and ask if there's anything else they want to mention.
- Keep your messages SHORT — 1-2 sentences max per message. This is a chat, not an email.
- Be encouraging and show genuine interest in their business.
- Do NOT generate the profile yet — just gather information through conversation.
- When you have enough info, your final message MUST include the exact phrase "I've got everything I need" — this is the signal that the conversation is done.`;

        const { text } = await generateText({
            model: zai("claude-sonnet-4-20250514"),
            system: systemPrompt,
            messages,
        });

        return Response.json({ message: text });
    } catch (err: any) {
        console.error("AI chat error:", err);
        return Response.json({ error: err.message || "AI chat failed" }, { status: 500 });
    }
}
