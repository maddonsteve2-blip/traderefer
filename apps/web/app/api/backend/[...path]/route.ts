import { NextRequest } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    const { path } = await context.params;
    const targetUrl = new URL(`${API_BASE}/${path.join("/")}`);
    targetUrl.search = request.nextUrl.search;

    const headers = new Headers();
    const authorization = request.headers.get("authorization");
    const contentType = request.headers.get("content-type");
    const accept = request.headers.get("accept");

    if (authorization) headers.set("authorization", authorization);
    if (contentType) headers.set("content-type", contentType);
    if (accept) headers.set("accept", accept);

    const upstream = await fetch(targetUrl.toString(), {
        method: request.method,
        headers,
        body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
        cache: "no-store",
    });

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get("content-type");
    if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType);

    return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
    });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return forward(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return forward(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return forward(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return forward(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
    return forward(request, context);
}
