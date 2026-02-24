import { SignIn } from "@clerk/nextjs";
import {
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";


export default function LoginPage() {
    return (
        <main className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
            {/* Left Side: Branding & Info */}
            <div className="md:w-1/2 bg-zinc-900 p-12 md:p-24 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 mb-20 group">
                        <Logo size="md" variant="white" />
                    </Link>

                    <h1 className="text-5xl md:text-7xl font-black text-white mb-8 font-display tracking-tight">
                        Connect. Refer.<br />
                        <span className="text-orange-500">Get Paid.</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-md leading-relaxed font-medium">
                        The premium network for tradespeople and professional referrers. Manage your leads and earnings in one place.
                    </p>
                </div>

                <div className="relative z-10 mt-12 md:mt-0">
                    <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl max-w-sm">
                        <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Secure Access</div>
                            <div className="text-xs text-zinc-500">Industry Standard Authentication</div>
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute -left-20 top-40 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            {/* Right Side: Form */}
            <div className="md:w-1/2 p-8 flex items-center justify-center">
                <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/register" appearance={{ elements: { socialButtonsRoot: 'hidden', dividerRow: 'hidden' } }} />
            </div>
        </main>
    );
}
