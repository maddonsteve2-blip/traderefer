import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";


export default function LeadSuccessPage() {
    return (
        <main className="flex-1 pt-12 md:pt-32 pb-20 bg-zinc-50 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl text-center">
                <div className="bg-white rounded-[32px] md:rounded-[40px] border border-zinc-200 shadow-2xl p-8 md:p-16 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-400 animate-pulse" />

                    <div className="w-20 h-20 md:w-24 md:h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
                    </div>

                    <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 mb-8 max-w-sm mx-auto">
                        <p className="text-green-800 font-black text-sm md:text-base flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                            Confirmation email sent
                        </p>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-zinc-900 mb-4 leading-tight tracking-tight">Your enquiry is sent!</h1>
                    <p className="text-base md:text-xl text-zinc-500 font-bold mb-10 leading-relaxed max-w-md mx-auto">
                        The business has received your details and will be in touch shortly.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                        <div className="bg-zinc-50 p-6 rounded-[24px] border border-zinc-100 flex items-center gap-4 text-left group hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-50 group-hover:border-orange-100">
                                <MessageSquare className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-0.5">Communication</div>
                                <div className="text-base font-black text-zinc-900">SMS Notification</div>
                            </div>
                        </div>
                        <div className="bg-zinc-50 p-6 rounded-[24px] border border-zinc-100 flex items-center gap-4 text-left group hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-50 group-hover:border-orange-100">
                                <Phone className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-0.5">Final Phase</div>
                                <div className="text-base font-black text-zinc-900">Direct Contact</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 text-white rounded-[20px] px-10 h-16 md:h-18 text-lg font-black w-full sm:w-auto shadow-2xl shadow-orange-500/20 transition-all active:scale-95">
                            <Link href="/">Back to Home <ChevronRight className="ml-2 w-5 h-5" /></Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-[20px] px-10 h-16 md:h-18 text-lg font-black w-full sm:w-auto border-2 border-zinc-100 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-all active:scale-95">
                            <Link href="/businesses">Explore More</Link>
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
