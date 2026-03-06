import { NextRequest, NextResponse } from "next/server";

const ALLOWED = new Set(["hot", "new", "top-earners"]);

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    const { type } = await params;
    if (!ALLOWED.has(type)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const search = req.nextUrl.searchParams.toString();
    const upstream = `${apiUrl}/discover/${type}${search ? `?${search}` : ""}`;

    try {
        const res = await fetch(upstream, { next: { revalidate: 60 } });
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json([], { status: 200 });
    }
}
