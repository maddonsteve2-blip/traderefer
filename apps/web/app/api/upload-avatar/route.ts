import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    }

    const filename = `avatars/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;

    const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
}
