import { Mail, MapPin, Clock, MessageSquare, ArrowRight } from "lucide-react";
import { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
    title: "Contact Us | TradeRefer — Australia's Trade Referral Marketplace",
    description: "Get in touch with TradeRefer. Support for referrers, businesses, and marketplace inquiries. Mon-Fri 9AM-5PM AEST.",
    alternates: { canonical: "https://traderefer.au/contact" },
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-zinc-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-20">
                    {/* Left: Info */}
                    <div className="flex-1 space-y-12">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 font-display tracking-tight leading-none mb-6">
                                Let's scale your <span className="text-orange-500">tradie network</span>
                            </h1>
                            <p className="text-xl text-zinc-500 font-medium leading-relaxed">
                                Our team is here to help with your referrals, billing, and marketplace inquiries.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-base font-black text-orange-500 uppercase tracking-widest mb-1">Office Hours</div>
                                    <div className="font-bold text-zinc-900">Mon — Fri, 9AM — 5PM AEST</div>
                                    <div className="text-xs text-zinc-400 font-medium">Melbourne / Sydney Local Time</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-400">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-base font-black text-orange-500 uppercase tracking-widest mb-1">Based In</div>
                                    <div className="font-bold text-zinc-900 leading-snug">TradeRefer is an online service based in Geelong, Victoria.</div>
                                    <div className="text-xs text-zinc-400 font-medium mt-1">ABN 88 764 351 213</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-zinc-900 rounded-[32px] text-white">
                            <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-4">Common FAQ</div>
                            <div className="space-y-4">
                                {[
                                    "How to dispute a lead",
                                    "Payment cycles & billing terms",
                                    "Account verification process"
                                ].map((faq) => (
                                    <div key={faq} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-3 rounded-xl transition-colors">
                                        <span className="font-bold text-sm text-zinc-300 group-hover:text-white">{faq}</span>
                                        <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="flex-1">
                        <div className="bg-white rounded-[40px] border border-zinc-200 p-8 md:p-12 shadow-xl shadow-zinc-200/50">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <MessageSquare className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-zinc-900 font-display">Send us a message</h2>
                            </div>

                            <ContactForm />
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-6">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold">
                                <Mail className="w-4 h-4 text-zinc-300" />
                                support@traderefer.au
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
