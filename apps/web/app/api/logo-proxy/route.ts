import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) return new NextResponse("Missing url", { status: 400 });

    // Only proxy known-safe Google profile photo URLs
    if (!url.startsWith("https://lh") || !url.includes("googleusercontent.com")) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; TradeRefer/1.0)",
            },
            cache: "force-cache",
        });

        if (!res.ok) return new NextResponse("Not found", { status: 404 });

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) {
            return new NextResponse("Not an image", { status: 404 });
        }

        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            },
        });
    } catch {
        return new NextResponse("Error fetching image", { status: 500 });
    }
}
