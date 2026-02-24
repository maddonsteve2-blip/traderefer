import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const zai = createOpenAI({
    apiKey: process.env.ZAI_API_KEY,
    baseURL: "https://api.z.ai/api/coding/paas/v4/",
});

export async function POST(req: Request) {
    const body = await req.json();
    const { business_name, trade_category, suburb, years_experience, specialty, highlights } = body;

    const highlightsList = (highlights || []).join(", ");

    const { object } = await generateObject({
        model: zai("glm-5"),
        schema: z.object({
            description: z.string().describe("A compelling 2-3 sentence business description for a tradie profile. Written in first person plural (we). Professional but approachable tone. Must mention their location and specialty."),
            why_refer_us: z.string().describe("A 2-3 sentence pitch about why referrers should send leads to this business. Focus on reliability, quality, and customer satisfaction."),
            services: z.array(z.string()).describe("A list of 5-8 specific services this trade business likely offers based on their category and specialty."),
            features: z.array(z.string()).describe("A list of 3-5 business highlights/features as short punchy phrases, e.g. 'Licensed & Insured', 'Same-Day Service', '10+ Years Experience'"),
        }),
        prompt: `Generate a professional tradie business profile for an Australian trades business.

Business Details:
- Business Name: ${business_name}
- Trade Category: ${trade_category}
- Location: ${suburb}, VIC (Geelong region, Australia)
- Years in Business: ${years_experience || "Not specified"}
- Specialty/Focus: ${specialty || "General " + trade_category}
- Business Highlights: ${highlightsList || "None specified"}

Requirements:
- Write in Australian English (use "specialise" not "specialize", "colour" not "color", etc.)
- Keep it professional but approachable — tradies, not corporate
- Description should be 2-3 sentences, first person plural ("We")
- Why Refer Us should convince a referrer to send leads
- Services should be specific to this trade category
- Features should be short punchy phrases, not sentences
- Do NOT use emojis or exclamation marks excessively`,
    });

    return Response.json(object);
}
