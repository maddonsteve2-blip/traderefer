import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";


export default function LeadSuccessPage() {
    return (
        <main className="flex-1 pt-32 pb-20 bg-zinc-50 min-h-screen flex items-center justify-center">
            <div className="container mx-auto px-4 max-w-2xl text-center">
                <div className="bg-white rounded-[40px] border border-zinc-200 shadow-2xl p-12 md:p-16 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600" />

                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-gravity-glow">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8">
                        <p className="text-green-800 font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Confirmation email sent to your inbox
                        </p>
                    </div>

                    <h1 className="text-4xl font-black text-zinc-900 mb-4 font-display">Enquiry sent!</h1>
                    <p className="text-xl text-zinc-600 mb-10 leading-relaxed">
                        Thanks for your enquiry. The business has received your details and will be in touch shortly.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex items-center gap-4 text-left">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <MessageSquare className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Communication</div>
                                <div className="text-sm font-bold text-zinc-900">SMS Notifications</div>
                            </div>
                        </div>
                        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 flex items-center gap-4 text-left">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <Phone className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Next Step</div>
                                <div className="text-sm font-bold text-zinc-900">Direct Contact</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="bg-zinc-900 hover:bg-black text-white rounded-full px-8 h-14 text-lg font-bold w-full sm:w-auto">
                            <Link href="/businesses">Back to Directory</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg font-bold w-full sm:w-auto border-zinc-200 hover:bg-zinc-50">
                            <Link href="/">Homepage <ChevronRight className="ml-2 w-4 h-4" /></Link>
                        </Button>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-4">
                    <Logo size="sm" showText={false} />
                    <p className="text-zinc-400 text-sm italic">
                        Check your email for confirmation. The business will contact you shortly.
                    </p>
                </div>
            </div>
        </main>
    );
}
