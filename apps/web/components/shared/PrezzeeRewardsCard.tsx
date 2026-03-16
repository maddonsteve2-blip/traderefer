import Link from "next/link";

const PREZZEE_LOGO = "/images/prezzee/prezzee-logo.svg";
const PREZZEE_CARD_GIF = "/images/prezzee/prezzee-smart-card.webp";

interface PrezzeeRewardsCardProps {
    rewardsHref: string;
}

export function PrezzeeRewardsCard({ rewardsHref }: PrezzeeRewardsCardProps) {
    return (
        <div className="bg-[#0F172A] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={PREZZEE_CARD_GIF}
                alt="Prezzee Smart Card"
                className="absolute -right-4 -top-4 w-32 rounded-2xl pointer-events-none opacity-90 group-hover:scale-110 transition-transform duration-700"
            />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-white font-black uppercase tracking-[0.2em]" style={{ fontSize: 14 }}>Rewards by</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={PREZZEE_LOGO} alt="Prezzee" className="h-4.5 w-auto brightness-0 invert opacity-80" />
                </div>
                <h3 className="font-black text-white mb-2" style={{ fontSize: 28 }}>Earn $25 Gift Cards</h3>
                <p className="text-white font-bold mb-2 leading-tight" style={{ fontSize: 20 }}>
                    Invite 5 friends who join TradeRefer
                </p>
                <p className="text-zinc-300 font-bold mb-5 leading-relaxed" style={{ fontSize: 18 }}>
                    → <span className="text-white font-black text-xl">$25 Prezzee Smart Card</span>, automatically issued.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                    {["Woolworths", "Bunnings", "Uber", "+400"].map((b) => (
                        <span key={b} className="font-black bg-white/10 text-white px-3 py-1 rounded-lg uppercase tracking-widest border border-white/5" style={{ fontSize: 12 }}>{b}</span>
                    ))}
                </div>
                <Link
                    href={rewardsHref}
                    className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black py-4 transition-all mb-3 shadow-xl shadow-orange-600/20 active:scale-95"
                    style={{ fontSize: 20 }}
                >
                    View My Rewards
                </Link>
                <Link
                    href="/rewards"
                    className="block w-full text-center text-zinc-400 hover:text-white font-black py-1 transition-all underline underline-offset-4 decoration-2 decoration-zinc-700 hover:decoration-white"
                    style={{ fontSize: 17 }}
                >
                    See all 335 brands →
                </Link>
            </div>
        </div>
    );
}
