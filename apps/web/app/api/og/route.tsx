import { ImageResponse } from "next/og";

const size = {
    width: 1200,
    height: 630,
};

const themes = {
    home: { accent: "#F97316", accentSoft: "#FED7AA", deep: "#111827", mid: "#27272A", tint: "#FFF7ED" },
    profile: { accent: "#EA580C", accentSoft: "#FDBA74", deep: "#0F172A", mid: "#334155", tint: "#FFF7ED" },
    "local-trade": { accent: "#2563EB", accentSoft: "#BFDBFE", deep: "#111827", mid: "#1E3A8A", tint: "#EFF6FF" },
    suburb: { accent: "#16A34A", accentSoft: "#BBF7D0", deep: "#132018", mid: "#166534", tint: "#F0FDF4" },
    top: { accent: "#D97706", accentSoft: "#FDE68A", deep: "#18181B", mid: "#78350F", tint: "#FFFBEB" },
    "near-me": { accent: "#7C3AED", accentSoft: "#DDD6FE", deep: "#171320", mid: "#4C1D95", tint: "#F5F3FF" },
    "trade-guide": { accent: "#0891B2", accentSoft: "#A5F3FC", deep: "#102027", mid: "#155E75", tint: "#ECFEFF" },
    job: { accent: "#C2410C", accentSoft: "#FED7AA", deep: "#18181B", mid: "#7C2D12", tint: "#FFF7ED" },
} as const;

function clean(value: string | null, fallback = "") {
    return (value || fallback).replace(/\s+/g, " ").trim();
}

function trim(value: string, max: number) {
    return value.length > max ? `${value.slice(0, max - 1).trim()}…` : value;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const template = clean(searchParams.get("template"), "home") as keyof typeof themes;
    const theme = themes[template] || themes.home;
    const title = trim(clean(searchParams.get("title"), "TradeRefer"), 86);
    const subtitle = trim(clean(searchParams.get("subtitle"), "Australia's verified trade referral marketplace."), 132);
    const eyebrow = trim(clean(searchParams.get("eyebrow"), "TradeRefer"), 34);
    const badge = trim(clean(searchParams.get("badge"), "Verified local trades"), 36);
    const stats = [
        clean(searchParams.get("stat1")),
        clean(searchParams.get("stat2")),
        clean(searchParams.get("stat3")),
    ].filter(Boolean).slice(0, 3);

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: `linear-gradient(135deg, ${theme.deep} 0%, ${theme.mid} 58%, #09090B 100%)`,
                    color: "#FFFFFF",
                    padding: "54px",
                    fontFamily: "Inter, Arial, sans-serif",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        right: "-120px",
                        top: "-130px",
                        width: "430px",
                        height: "430px",
                        borderRadius: "50%",
                        background: theme.accent,
                        opacity: 0.28,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        right: "76px",
                        bottom: "72px",
                        width: "240px",
                        height: "240px",
                        borderRadius: "50%",
                        border: `34px solid ${theme.accent}`,
                        opacity: 0.18,
                    }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "76px",
                                height: "76px",
                                borderRadius: "22px",
                                background: theme.accent,
                                color: "#FFFFFF",
                                fontSize: "34px",
                                fontWeight: 900,
                            }}
                        >
                            TR
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    fontSize: "19px",
                                    fontWeight: 900,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    color: theme.accentSoft,
                                }}
                            >
                                {eyebrow}
                            </div>
                            <div style={{ display: "flex", fontSize: "28px", fontWeight: 900 }}>TradeRefer</div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "999px",
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.18)",
                            color: "#FFFFFF",
                            padding: "13px 22px",
                            fontSize: "19px",
                            fontWeight: 900,
                        }}
                    >
                        {badge}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "880px" }}>
                    <div
                        style={{
                            display: "flex",
                            fontSize: title.length > 58 ? "58px" : "66px",
                            lineHeight: 1.04,
                            fontWeight: 900,
                            letterSpacing: "-0.03em",
                            color: "#FFFFFF",
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            fontSize: "28px",
                            lineHeight: 1.32,
                            fontWeight: 650,
                            color: "#E4E4E7",
                            maxWidth: "810px",
                        }}
                    >
                        {subtitle}
                    </div>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                    {(stats.length ? stats : ["ABN-checked", "Local referrals", "Free quotes"]).map((stat) => (
                        <div
                            key={stat}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: "210px",
                                borderRadius: "20px",
                                background: theme.tint,
                                color: "#18181B",
                                padding: "18px 24px",
                                fontSize: "24px",
                                fontWeight: 900,
                            }}
                        >
                            {trim(stat, 34)}
                        </div>
                    ))}
                </div>
            </div>
        ),
        size
    );
}
