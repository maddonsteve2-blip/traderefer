"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ReferrerDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Referrer Dashboard Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-sm border border-zinc-100 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Something went wrong</h2>
        <p className="text-zinc-500 font-medium mb-8">
          The dashboard encountered a client-side exception. This can happen right after completing onboarding while your profile is being indexed.
        </p>

        <div className="space-y-3">
          <Button 
            onClick={() => reset()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-14 font-black shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            <RefreshCcw className="w-5 h-5 mr-2" />
            Try Again
          </Button>

          <Link href="/dashboard" className="block">
            <Button 
              variant="outline"
              className="w-full border-2 border-zinc-100 rounded-2xl h-14 font-black text-zinc-600 hover:bg-zinc-50 transition-all"
            >
              <Home className="w-5 h-5 mr-2" />
              Return to Hub
            </Button>
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 text-left">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Technical Details</p>
            <div className="bg-zinc-50 rounded-xl p-4 overflow-auto max-h-40 border border-zinc-100">
              <code className="text-xs text-red-500 font-mono break-all">{error.message}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
