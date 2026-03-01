import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getPostHogClient } from "@/lib/posthog-server";

const zai = createOpenAI({
    apiKey: process.env.ZAI_API_KEY,
    baseURL: "https://api.z.ai/api/coding/paas/v4",
});

const FALLBACK_QUESTIONS = [
    (trade: string) => `G'day! How long have you been running your ${trade} business?\nSuggestions: Less than 1 year, 1-2 years, 3-5 years, 5-10 years, 10-15 years, 15-20 years, 20+ years, Just started, Over a decade, About 5 years, Around 3 years, More than 15 years`,
    (trade: string) => `What's your main bread-and-butter work — your specialty as a ${trade}?\nSuggestions: General repairs, Emergency callouts, New installations, Renovations, Commercial fit-outs, Maintenance contracts, Insurance work, New builds, Residential service, Industrial work, Strata maintenance, Body corporate work`,
    (_trade: string) => `What's the full list of services you offer?\nSuggestions: Repairs, Installations, Maintenance, Emergency callouts, Inspections, Quotes, Commercial work, Residential work, Renovations, New builds, Upgrades, Fit-outs`,
    (_trade: string) => `Which areas and suburbs do you cover?\nSuggestions: All of Melbourne, Northern suburbs, Southern suburbs, Eastern suburbs, Western suburbs, Geelong region, Mornington Peninsula, Yarra Valley, CBD and inner city, All of Sydney, Brisbane northside, Gold Coast`,
    (_trade: string) => `What sets you apart from other tradies in your area?\nSuggestions: Same-day service, Fixed pricing, 10-year warranty, Family-owned, 24/7 availability, Licensed and insured, Award-winning, Transparent quoting, GPS-tracked vans, Senior discounts, Clean and tidy, Fully stocked vans`,
    (_trade: string) => `Is there anything you're especially proud of — guarantees, awards, or response times?\nSuggestions: Lifetime workmanship warranty, 1-hour response, Best-price guarantee, 5-star Google reviews, Industry award winner, No call-out fee, Same-day quotes, Upfront pricing, 100% satisfaction guarantee, Over 500 reviews, Tradie of the Year finalist, BBB accredited`,
    (_trade: string) => `Who are your ideal customers — mainly residential, commercial, or both?\nSuggestions: Residential only, Commercial only, Both residential and commercial, Strata and body corporate, Real estate agents, Property managers, Small businesses, Homeowners, Renovators, Landlords, Industrial clients, Government contracts`,
];

export async function POST(req: Request) {
    const { messages, business_name, trade_category, suburb } = await req.json();
    const userMessageCount = (messages || []).filter((m: any) => m.role === 'user').length;

    try {
        const systemPrompt = `You are a friendly Australian onboarding assistant for TradeRefer — a platform that connects tradies with referrers who send them customers.

CONTEXT:
- Business name: "${business_name}"
- Trade: ${trade_category}
- Location: ${suburb}, VIC (Geelong region)
- Questions answered so far: ${userMessageCount}

YOUR JOB: Have a casual chat to learn about their business. You MUST ask ALL 7 topics below before wrapping up.

ABSOLUTE RULES — FOLLOW THESE EXACTLY:

1. NEVER use markdown. No **, no ##, no *, no bullet points with -, no numbered lists with formatting. Write in PLAIN TEXT only. This is a chat, not a document.

2. Ask ONE topic per message. Here are the 7 topics in order:
   Q1: How long in business
   Q2: Main specialty / bread and butter work
   Q3: Full list of services they offer
   Q4: Areas and suburbs they cover
   Q5: What makes them stand out from competitors
   Q6: Anything they're proud of (guarantees, awards, response times)
   Q7: Ideal customers — residential, commercial, or both

3. EVERY message that asks a question MUST end with a Suggestions line. Format:
   Suggestions: answer1, answer2, answer3, answer4, answer5, answer6, answer7, answer8, answer9, answer10, answer11, answer12

   Give 10-12 short suggestions (2-5 words each), comma-separated, realistic for a ${trade_category} business.

4. Keep responses to 1-2 SHORT sentences before the Suggestions line. Be encouraging but brief.

5. You have answered ${userMessageCount} questions so far. You need at least 7. DO NOT say "I've got everything I need" until ${userMessageCount >= 6 ? "now — you can wrap up after this answer" : `you have asked all 7 topics. You still have ${7 - userMessageCount} more to go`}.

6. When wrapping up (ONLY after 7+ questions answered): Write a SHORT plain text summary like "Here is what I have got: [business name], [years] years experience, specialising in [x], covering [areas], services include [list]. You are known for [differentiators]." Then include the exact phrase "I've got everything I need".

7. NEVER generate a profile, bio, or description in the chat. Just gather info.
8. NEVER use formatting like bold, italic, headings, or bullet points. Plain conversational text only.`;

        const { text } = await generateText({
            model: zai.chat("glm-5"),
            system: systemPrompt,
            messages,
        });

        try {
            const posthog = getPostHogClient();
            posthog.capture({
                distinctId: business_name || 'anonymous',
                event: 'ai_chat_message_sent',
                properties: { trade_category, suburb, user_message_count: userMessageCount, conversation_done: text.toLowerCase().includes("i've got everything i need") }
            });
        } catch { /* non-fatal */ }

        return Response.json({ message: text });
    } catch (err: any) {
        // Log full details server-side to diagnose Z.AI issues
        console.error("AI chat error — status:", err?.status, "message:", err?.message, "cause:", err?.cause);

        // Fall back to scripted questions so onboarding is never blocked
        const questionIdx = Math.min(userMessageCount, FALLBACK_QUESTIONS.length - 1);
        const fallbackText = FALLBACK_QUESTIONS[questionIdx](trade_category || "trade");

        // Wrap up fallback after all 7 questions answered
        if (userMessageCount >= 7) {
            const wrapUp = `Here is what I have got: ${business_name}, covering your local area with professional ${trade_category} services. I've got everything I need to build your profile!`;
            return Response.json({ message: wrapUp });
        }

        return Response.json({ message: fallbackText });
    }
}
