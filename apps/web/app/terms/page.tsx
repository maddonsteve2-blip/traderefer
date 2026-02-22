import { Gavel, CheckCircle2, ShieldAlert, CreditCard, Scale, ExternalLink } from "lucide-react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";

export default function TermsPage() {
    const sections = [
        {
            id: "01",
            title: "Introduction",
            content: "TradeRefer is a technology platform designed to facilitate the exchange of business leads within the Australian market. We provide a decentralized marketplace where 'Referrers' can post high-quality business leads and 'Businesses' can purchase the right to access those leads.",
            icon: Scale
        },
        {
            id: "02",
            title: "Lead Verification",
            content: "To maintain marketplace integrity, all leads must undergo a strict verification process. Referrers warrant that every lead provided is accurate, current, and obtained with the necessary permissions under Australian privacy laws.",
            bullets: [
                "Accuracy: Lead contact details must be verified within 48 hours of posting.",
                "Exclusivity: Leads must not be sold on competing platforms simultaneously.",
                "Consent: The lead must have explicitly consented to being contacted."
            ],
            icon: CheckCircle2
        },
        {
            id: "03",
            title: "PIN-based Dispute Resolution",
            content: "TradeRefer utilizes a proprietary PIN-based verification system to ensure transaction fairness and automate dispute resolution.",
            subsections: [
                { label: "Issue of PIN", text: "Upon purchase, a unique 6-digit PIN is generated." },
                { label: "Confirmation", text: "Once the PIN is entered, the transaction is marked as 'Won' and funds released." },
                { label: "Automated Dispute", text: "If no PIN is entered within 30 days, a compliance review is triggered." }
            ],
            icon: ShieldAlert
        },
        {
            id: "04",
            title: "Unlock Fees",
            content: "To access the full contact details of any lead on the marketplace, Businesses must pay an 'Unlock Fee'. This fee is determined based on the lead's estimated value, industry sector, and referral strength.",
            icon: CreditCard
        },
        {
            id: "05",
            title: "Withdrawals",
            content: "Earnings from lead commissions are held in the TradeRefer Trust Account until they are eligible for withdrawal. Users must have a minimum balance of $50 AUD to initiate a transfer to an Australian bank account.",
            icon: CreditCard
        }
    ];

    return (
        <div className="min-h-screen bg-zinc-50 pt-32 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-8">
                    <BackButton />
                </div>
                <div className="mb-16 text-center">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <Gavel className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-zinc-900 font-display tracking-tight mb-4">Terms of Service</h1>
                    <div className="text-sm font-black text-zinc-400 uppercase tracking-widest decoration-orange-500 underline underline-offset-8">
                        Governed by the laws of New South Wales, Australia
                    </div>
                </div>

                <div className="bg-white rounded-[40px] border border-zinc-200 p-8 md:p-16 shadow-sm">
                    <div className="bg-zinc-50 rounded-3xl p-8 mb-16 border border-zinc-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h2 className="text-xl font-black text-zinc-900 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" /> Acceptance of Terms
                            </h2>
                            <p className="text-zinc-600 font-medium leading-relaxed">
                                By accessing or using the TradeRefer marketplace, you agree to be bound by these Australian referral-powered lead marketplace rules. If you do not agree, please cease using the platform immediately.
                            </p>
                        </div>
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                    </div>

                    <div className="space-y-16">
                        {sections.map((section) => (
                            <div key={section.id} className="relative pl-12 md:pl-20 border-l border-zinc-100 pb-16 last:pb-0">
                                <div className="absolute left-0 top-0 -translate-x-1/2 w-10 h-10 md:w-16 md:h-16 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center shadow-sm">
                                    <section.icon className="w-5 h-5 md:w-8 md:h-8 text-zinc-400" />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-black text-orange-500 font-display">{section.id}</span>
                                        <h3 className="text-2xl font-black text-zinc-900 font-display">{section.title}</h3>
                                    </div>

                                    <p className="text-zinc-600 font-medium leading-relaxed">
                                        {section.content}
                                    </p>

                                    {section.bullets && (
                                        <div className="space-y-3 pt-4">
                                            {section.bullets.map((bullet, i) => (
                                                <div key={i} className="flex items-center gap-3 text-sm font-bold text-zinc-500">
                                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                                    {bullet}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {section.subsections && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                                            {section.subsections.map((sub, i) => (
                                                <div key={i} className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                                                    <div className="text-base font-black text-zinc-400 uppercase tracking-widest mb-1">{sub.label}</div>
                                                    <div className="text-sm font-bold text-zinc-900">{sub.text}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 pt-16 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-sm font-bold text-zinc-400">© 2026 TradeRefer Pty Ltd</div>
                        <div className="flex gap-8">
                            <Link href="/privacy" className="text-sm font-black text-zinc-900 hover:text-orange-600 flex items-center gap-2">
                                Privacy Policy <ExternalLink className="w-3 h-3" />
                            </Link>
                            <Link href="/contact" className="text-sm font-black text-zinc-900 hover:text-orange-600 flex items-center gap-2">
                                Support <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
