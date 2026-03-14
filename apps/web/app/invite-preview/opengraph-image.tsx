import { ImageResponse } from "next/og";

export const alt = "Join TradeRefer as a Referrer";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "linear-gradient(135deg, #09090B 0%, #18181B 55%, #27272A 100%)",
                    color: "white",
                    padding: "56px",
                    fontFamily: "Inter, Arial, sans-serif",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "18px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                height: "72px",
                                width: "72px",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "22px",
                                background: "#FF6A00",
                                fontSize: "34px",
                                fontWeight: 900,
                                color: "white",
                            }}
                        >
                            TR
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "20px",
                                    letterSpacing: "0.24em",
                                    textTransform: "uppercase",
                                    color: "#A1A1AA",
                                    fontWeight: 800,
                                }}
                            >
                                TradeRefer Invite
                            </div>
                            <div
                                style={{
                                    fontSize: "28px",
                                    fontWeight: 900,
                                }}
                            >
                                Join as a Referrer
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "9999px",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            padding: "12px 20px",
                            fontSize: "18px",
                            color: "#FDBA74",
                            fontWeight: 800,
                        }}
                    >
                        Invite-only sign up
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "22px",
                        maxWidth: "760px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            fontSize: "68px",
                            lineHeight: 1.02,
                            fontWeight: 900,
                            letterSpacing: "-0.04em",
                        }}
                    >
                        Refer trusted tradies.
                        <br />
                        Earn on verified leads.
                    </div>
                    <div
                        style={{
                            display: "flex",
                            fontSize: "28px",
                            lineHeight: 1.35,
                            color: "#D4D4D8",
                            fontWeight: 500,
                        }}
                    >
                        Create your free TradeRefer account and start building a professional referral network with invite tracking, partner links, and rewards.
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "stretch",
                        gap: "18px",
                    }}
                >
                    {[
                        "Free account",
                        "Verified trade network",
                        "Referral rewards",
                    ].map((item) => (
                        <div
                            key={item}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "22px",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                padding: "18px 24px",
                                fontSize: "24px",
                                fontWeight: 800,
                                color: "#FAFAFA",
                            }}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        ),
        size
    );
}
