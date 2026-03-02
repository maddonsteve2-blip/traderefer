import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Cookie Policy | TradeRefer",
    description: "Learn how TradeRefer uses cookies to improve your experience on our platform.",
};

export default function CookiesPage() {
    return (
        <main className="min-h-screen bg-[#FCFCFC] pt-28 pb-20">
            <div className="max-w-3xl mx-auto px-4">
                <h1 className="text-4xl font-black text-zinc-900 mb-2">Cookie Policy</h1>
                <p className="text-sm text-zinc-500 mb-10">Last updated: March 2026</p>

                <div className="space-y-10 text-zinc-700 text-lg leading-relaxed">

                    <section>
                        <h2 className="text-2xl font-black text-zinc-900 mb-3">What Are Cookies?</h2>
                        <p>Cookies are small text files placed on your device when you visit a website. They help the site remember your preferences, keep you logged in, and understand how you use the platform so we can improve it.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-zinc-900 mb-4">How TradeRefer Uses Cookies</h2>
                        <div className="space-y-4">
                            <div className="bg-white border border-zinc-200 rounded-xl p-6">
                                <span className="bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">Essential</span>
                                <h3 className="font-black text-zinc-900 mt-3 mb-1">Functional Cookies</h3>
                                <p className="text-base text-zinc-600">Required for the platform to work. These include authentication tokens (via Clerk), session management, and security cookies. You cannot opt out of these without losing access to your account.</p>
                            </div>
                            <div className="bg-white border border-zinc-200 rounded-xl p-6">
                                <span className="bg-blue-100 text-blue-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">Analytics</span>
                                <h3 className="font-black text-zinc-900 mt-3 mb-1">Analytics Cookies</h3>
                                <p className="text-base text-zinc-600">Help us understand how visitors use TradeRefer — which pages are viewed, how long people stay, and where they navigate. Data is aggregated and anonymous. We use Vercel Analytics for this purpose.</p>
                            </div>
                            <div className="bg-white border border-zinc-200 rounded-xl p-6">
                                <span className="bg-orange-100 text-orange-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">Third-Party</span>
                                <h3 className="font-black text-zinc-900 mt-3 mb-1">Third-Party Cookies</h3>
                                <p className="text-base text-zinc-600">Set by embedded services such as Clerk (authentication). These third parties have their own privacy and cookie policies which we encourage you to review.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-zinc-900 mb-3">Managing Cookies</h2>
                        <p>You can control cookies through your browser settings. Most browsers allow you to view and delete cookies, block cookies from specific sites, or be notified when a cookie is set.</p>
                        <p className="mt-3">Note that disabling certain cookies may affect the functionality of TradeRefer, particularly login and dashboard features.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-zinc-900 mb-3">Retention</h2>
                        <p>Session cookies are deleted when you close your browser. Persistent cookies remain on your device for a set period (typically 30–365 days) or until manually deleted.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-zinc-900 mb-3">Australian Privacy Compliance</h2>
                        <p>Our use of cookies complies with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs). For full details on how we handle personal data, see our{" "}
                            <Link href="/privacy" className="text-orange-600 font-bold hover:underline">Privacy Policy</Link>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-zinc-900 mb-3">Contact</h2>
                        <p>Questions about cookies or your privacy? Visit our{" "}
                            <Link href="/contact" className="text-orange-600 font-bold hover:underline">contact page</Link>{" "}or email <span className="font-bold">privacy@traderefer.au</span>.
                        </p>
                    </section>

                </div>

                <div className="mt-12 flex gap-6 text-sm text-zinc-500">
                    <Link href="/privacy" className="hover:text-orange-600 transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-orange-600 transition-colors">Terms of Service</Link>
                    <Link href="/" className="hover:text-orange-600 transition-colors">← Back to Home</Link>
                </div>
            </div>
        </main>
    );
}
