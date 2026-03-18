import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const MAX_PHOTOS = 10;

const db = postgres(process.env.DATABASE_URL!, { max: 3 });

/**
 * POST /api/enrich-business
 * 
 * Called from the business profile page (server-side, fire-and-forget).
 * If photos or description are missing, fetches from Google Places →
 * downloads photos → uploads to Vercel Blob → updates DB.
 */
export async function POST(req: NextRequest) {
    try {
        const { businessId, businessName, suburb, state, slug, currentPhotoCount, hasEditorialDescription } = await req.json();

        if (!businessId || !businessName || !slug) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (currentPhotoCount >= 3 && hasEditorialDescription) {
            return NextResponse.json({ status: "already_enriched" });
        }

        if (!GOOGLE_API_KEY) {
            return NextResponse.json({ error: "No Google API key configured" }, { status: 500 });
        }

        // Prevent duplicate enrichment within 24 hours
        const [row] = await db`SELECT enriched_at FROM businesses WHERE id = ${businessId}`;
        if (row?.enriched_at) {
            const hoursSince = (Date.now() - new Date(row.enriched_at).getTime()) / 3600000;
            if (hoursSince < 24) {
                return NextResponse.json({ status: "recently_enriched" });
            }
        }

        // Search Google Places
        const query = `${businessName} ${suburb} ${state} Australia`;
        const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.photos,places.editorialSummary",
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
        });

        if (!searchRes.ok) {
            console.error(`[enrich] Google search failed for ${businessName}: ${searchRes.status}`);
            return NextResponse.json({ error: "Google API error" }, { status: 502 });
        }

        const searchData = await searchRes.json();
        const place = searchData.places?.[0];
        if (!place) {
            await db`UPDATE businesses SET enriched_at = now() WHERE id = ${businessId}`;
            return NextResponse.json({ status: "no_place_found" });
        }

        let newPhotoUrls: string[] | null = null;
        let newDescription: string | null = null;

        // --- PHOTOS ---
        if (currentPhotoCount < 3 && place.photos?.length > 0) {
            const photoRefs = place.photos.slice(0, MAX_PHOTOS);
            const blobUrls: string[] = [];

            const [existingRow] = await db`SELECT photo_urls FROM businesses WHERE id = ${businessId}`;
            const existingUrls: string[] = Array.isArray(existingRow?.photo_urls)
                ? existingRow.photo_urls.filter((u: string) => u && u.includes("blob.vercel-storage.com"))
                : [];

            for (let i = 0; i < photoRefs.length; i++) {
                try {
                    const mediaUrl = `https://places.googleapis.com/v1/${photoRefs[i].name}/media?maxWidthPx=800&maxHeightPx=800`;
                    const photoRes = await fetch(mediaUrl, {
                        headers: { "X-Goog-Api-Key": GOOGLE_API_KEY },
                        redirect: "manual",
                    });

                    let imageUrl: string | null = null;
                    if (photoRes.status === 302) {
                        imageUrl = photoRes.headers.get("location");
                    }
                    if (!imageUrl) continue;

                    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
                    if (!imgRes.ok) continue;

                    const buf = await imgRes.arrayBuffer();
                    if (buf.byteLength < 2000) continue;

                    const ct = imgRes.headers.get("content-type") || "image/jpeg";
                    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
                    const filename = `business-photos/${slug}-${i}.${ext}`;

                    if (BLOB_TOKEN) {
                        const blobRes = await fetch(`https://blob.vercel-storage.com/${filename}`, {
                            method: "PUT",
                            headers: {
                                Authorization: `Bearer ${BLOB_TOKEN}`,
                                "x-content-type": ct,
                                "x-cache-control-max-age": "31536000",
                            },
                            body: Buffer.from(buf),
                        });

                        if (blobRes.ok) {
                            const blobData = await blobRes.json();
                            blobUrls.push(blobData.url);
                        }
                    }
                } catch {
                    // Skip failed photos
                }
            }

            if (blobUrls.length > 0) {
                newPhotoUrls = [...new Set([...existingUrls, ...blobUrls])].slice(0, MAX_PHOTOS);
            }
        }

        // --- DESCRIPTION ---
        if (!hasEditorialDescription && place.editorialSummary?.text) {
            newDescription = place.editorialSummary.text;
        }

        // --- SAVE ---
        if (newPhotoUrls && newDescription) {
            await db`
                UPDATE businesses SET
                    photo_urls = ${newPhotoUrls},
                    logo_url = COALESCE(NULLIF(logo_url, ''), ${newPhotoUrls[0]}),
                    cover_photo_url = COALESCE(NULLIF(cover_photo_url, ''), ${newPhotoUrls.length > 1 ? newPhotoUrls[1] : newPhotoUrls[0]}),
                    description = ${newDescription},
                    enriched_at = now(),
                    updated_at = now()
                WHERE id = ${businessId}
            `;
        } else if (newPhotoUrls) {
            await db`
                UPDATE businesses SET
                    photo_urls = ${newPhotoUrls},
                    logo_url = COALESCE(NULLIF(logo_url, ''), ${newPhotoUrls[0]}),
                    cover_photo_url = COALESCE(NULLIF(cover_photo_url, ''), ${newPhotoUrls.length > 1 ? newPhotoUrls[1] : newPhotoUrls[0]}),
                    enriched_at = now(),
                    updated_at = now()
                WHERE id = ${businessId}
            `;
        } else if (newDescription) {
            await db`
                UPDATE businesses SET
                    description = ${newDescription},
                    enriched_at = now(),
                    updated_at = now()
                WHERE id = ${businessId}
            `;
        } else {
            await db`UPDATE businesses SET enriched_at = now() WHERE id = ${businessId}`;
        }

        return NextResponse.json({
            status: "enriched",
            photosAdded: newPhotoUrls ? newPhotoUrls.length : 0,
            descriptionUpdated: !!newDescription,
        });
    } catch (e: any) {
        console.error("[enrich-business] Error:", e.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
