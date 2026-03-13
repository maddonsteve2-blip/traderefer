import { SignIn } from "@clerk/nextjs";
import {
    ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";


export default function LoginPage() {
    return (
        <main className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
            {/* Left Side: Branding & Info - Hidden on Mobile */}
            <div className="hidden md:flex md:w-1/2 bg-zinc-900 p-12 md:p-24 flex-col justify-between relative overflow-hidden">
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
            <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center bg-white md:bg-zinc-50">
                <div className="md:hidden flex flex-col items-center mb-12 text-center">
                    <Link href="/" className="mb-6">
                        <Logo size="md" />
                    </Link>
                    <h2 className="text-2xl font-black text-zinc-900 mb-2">Welcome Back</h2>
                    <p className="text-sm font-bold text-zinc-500">Sign in to manage your trade network</p>
                </div>
                
                <div className="w-full max-w-sm shadow-2xl md:shadow-none rounded-[28px] overflow-hidden">
                    <SignIn 
                        fallbackRedirectUrl="/dashboard" 
                        signUpUrl="/register" 
                        appearance={{
                            elements: {
                                card: "shadow-none border-none",
                                footerAction: "font-black text-orange-600 hover:text-orange-700",
                                formButtonPrimary: "bg-zinc-900 border-none shadow-xl hover:bg-zinc-800 text-base py-6 rounded-2xl",
                                headerTitle: "font-black tracking-tight",
                                headerSubtitle: "font-bold text-zinc-500",
                                socialButtonsBlockButton: "rounded-2xl border-2 border-zinc-100 hover:bg-zinc-50 font-bold",
                                formFieldLabel: "font-black text-xs uppercase tracking-widest text-zinc-400",
                                formFieldInput: "rounded-2xl h-12 border-2 border-zinc-100 focus:border-zinc-900 transition-all font-bold"
                            }
                        }}
                    />
                </div>
            </div>
        </main>
    );
}
