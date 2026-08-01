import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const MAX_BODY_BYTES = 20_000; // basic abuse guard
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/support
 *
 * Shared endpoint for the support page and contact page forms. Validates
 * and inserts into support_requests. department is optional (contact page
 * sends it, support page does not).
 */
export async function POST(req: NextRequest) {
    try {
        const contentLength = req.headers.get("content-length");
        if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
            return NextResponse.json({ error: "Request body too large" }, { status: 400 });
        }

        const rawBody = await req.text();
        if (rawBody.length > MAX_BODY_BYTES) {
            return NextResponse.json({ error: "Request body too large" }, { status: 400 });
        }

        let body: unknown;
        try {
            body = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { name, email, department, message } = (body ?? {}) as Record<string, unknown>;

        if (typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
            return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
        }
        if (typeof message !== "string" || message.trim().length < 10 || message.trim().length > 5000) {
            return NextResponse.json({ error: "Message must be between 10 and 5000 characters" }, { status: 400 });
        }
        if (department !== undefined && department !== null && typeof department !== "string") {
            return NextResponse.json({ error: "Invalid department" }, { status: 400 });
        }

        const departmentValue = typeof department === "string" && department.trim().length > 0 ? department.trim() : null;

        await sql`
            INSERT INTO support_requests (name, email, department, message)
            VALUES (${name.trim()}, ${email.trim()}, ${departmentValue}, ${message.trim()})
        `;

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[support] Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
