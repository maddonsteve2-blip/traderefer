import Link from "next/link";

const PREZZEE_LOGO = "https://cdn.prod.website-files.com/67e0cab92cc4f35b3b006055/6808567053b358df8bfa79c3_Logo%20Consumer_Web.svg";
const PREZZEE_CARD_GIF = "https://files.poweredbyprezzee.com/products/7af951a6-2a13-004b-f0eb-a87382a5b2e7/8eff8e56-2718-4514-8e1a-15ca1eb22793/Prezzee_3D_-_AU_%281%29_452_280.gif";

interface PrezzeeRewardsCardProps {
    rewardsHref: string;
}

export function PrezzeeRewardsCard({ rewardsHref }: PrezzeeRewardsCardProps) {
    return (
        <div className="bg-[#0F172A] rounded-2xl p-5 text-white relative overflow-hidden shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={PREZZEE_CARD_GIF}
                alt="Prezzee Smart Card"
                className="absolute -right-3 -top-3 w-28 rounded-xl pointer-events-none"
            />
            <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-white font-semibold uppercase tracking-wider text-base">Rewards by</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={PREZZEE_LOGO} alt="Prezzee" className="h-3.5 w-auto brightness-0 invert opacity-60" />
                </div>
                <h3 className="text-xl font-black text-white mb-1">Earn $25 Gift Cards</h3>
                <p className="text-white font-semibold text-base mb-1 leading-snug">
                    Invite 5 friends who join TradeRefer
                </p>
                <p className="text-zinc-300 font-semibold text-base mb-3 leading-relaxed">
                    → <span className="text-white font-bold">$25 Prezzee Smart Card</span>, automatically issued.
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                    {["Woolworths", "Bunnings", "Uber", "+400"].map((b) => (
                        <span key={b} className="text-base font-semibold bg-white/10 text-white px-2 py-0.5 rounded-full">{b}</span>
                    ))}
                </div>
                <Link
                    href={rewardsHref}
                    className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg py-3 transition-colors mb-2 shadow-lg shadow-orange-500/30"
                >
                    View My Rewards
                </Link>
                <Link
                    href="/rewards"
                    className="block w-full text-center text-zinc-300 hover:text-white text-base font-semibold py-1 transition-colors underline underline-offset-2"
                >
                    See all 335 brands →
                </Link>
            </div>
        </div>
    );
}
