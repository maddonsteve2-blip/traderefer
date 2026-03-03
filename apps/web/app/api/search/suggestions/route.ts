import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const TRADE_CATEGORIES = [
  "Air Conditioning & Heating",
  "Bricklaying",
  "Building & Carpentry",
  "Cabinet Making",
  "Cleaning",
  "Concreting",
  "Demolition",
  "Electrical",
  "Fencing",
  "Flooring",
  "Garage Doors",
  "Gardening & Lawn Care",
  "Glazing",
  "Handyman",
  "Insulation",
  "Landscaping",
  "Locksmith",
  "Painting",
  "Pest Control",
  "Plastering",
  "Plumbing",
  "Renovations",
  "Roofing",
  "Rubbish Removal",
  "Security Systems",
  "Sheds & Outdoor Structures",
  "Solar & Energy",
  "Tiling",
  "Tree Services",
  "Window Cleaning",
  "Other"
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim().toLowerCase() || "";
  const type = searchParams.get("type") || "all"; // 'all', 'trade', 'location'

  if (!query || query.length < 2) {
    return NextResponse.json({ trades: [], suburbs: [], postcodes: [] });
  }

  try {
    // Search trades
    let trades: string[] = [];
    if (type === "all" || type === "trade") {
      trades = TRADE_CATEGORIES.filter(
        (t) => t.toLowerCase().includes(query) && t !== "Other"
      ).slice(0, 6);
    }

    // Search suburbs and postcodes from database
    const suburbs: Array<{ suburb: string; city: string; state: string; count: number }> = [];

    if (type === "all" || type === "location") {
      // Search for suburbs by name
      const suburbResults = await sql`
        SELECT 
          suburb,
          city,
          state,
          COUNT(*)::int as count
        FROM businesses
        WHERE status = 'active'
          AND suburb ILIKE ${'%' + query + '%'}
          AND suburb IS NOT NULL
          AND suburb != ''
        GROUP BY suburb, city, state
        ORDER BY count DESC, suburb ASC
        LIMIT 8
      `;
      suburbResults.forEach(r => suburbs.push(r as any));

      // Also search by city name
      const cityResults = await sql`
        SELECT 
          city as suburb,
          city,
          state,
          COUNT(*)::int as count
        FROM businesses
        WHERE status = 'active'
          AND city ILIKE ${'%' + query + '%'}
          AND city IS NOT NULL
          AND city != ''
          AND (suburb IS NULL OR suburb NOT ILIKE ${'%' + query + '%'})
        GROUP BY city, state
        ORDER BY count DESC, city ASC
        LIMIT 4
      `;
      cityResults.forEach(r => suburbs.push(r as any));
    }

    return NextResponse.json({ trades, suburbs });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ trades: [], suburbs: [] });
  }
}
