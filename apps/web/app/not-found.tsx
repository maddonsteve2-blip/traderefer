import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="space-y-4">
                    <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto">
                        <Search className="w-12 h-12 text-orange-400" />
                    </div>
                    <h1 className="text-6xl font-black text-zinc-900 tracking-tight">404</h1>
                    <h2 className="text-2xl font-black text-zinc-700">Page not found</h2>
                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved. 
                        Let&apos;s get you back on track.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </Link>
                    <Link
                        href="/businesses"
                        className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-white border-2 border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-2xl font-black text-lg shadow-sm transition-all active:scale-95"
                    >
                        <Search className="w-5 h-5" />
                        Browse Businesses
                    </Link>
                </div>

                <p className="text-sm text-zinc-400 font-medium">
                    Need help?{" "}
                    <a href="mailto:support@traderefer.au" className="text-orange-600 hover:text-orange-700 font-bold underline underline-offset-2">
                        Contact support
                    </a>
                </p>
            </div>
        </div>
    );
}
