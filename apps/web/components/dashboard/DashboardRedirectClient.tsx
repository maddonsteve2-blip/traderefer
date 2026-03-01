"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function DashboardRedirectClient() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (!isLoaded) return;

    // If not signed in, redirect to login
    if (!isSignedIn) {
      router.push("/login");
      return;
    }

    // Prevent multiple redirect attempts
    if (isRedirecting) return;
    setIsRedirecting(true);

    const checkAuthStatus = async () => {
      try {
        const token = await getToken();
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        const res = await fetch(`${apiBase}/auth/status`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();

          if (data.has_business) {
            router.push("/dashboard/business");
          } else if (data.has_referrer) {
            router.push("/dashboard/referrer");
          } else {
            router.push("/onboarding");
          }
        } else if (res.status === 401) {
          // Unauthorized - redirect to login
          router.push("/login");
        } else {
          setError(`API error: ${res.status}`);
        }
      } catch (err) {
        console.error("Auth status check failed:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    // Add a small delay to prevent rapid navigation
    const timer = setTimeout(checkAuthStatus, 100);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, getToken, router, isRedirecting]);

  // Show loading state while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        {error ? (
          <div className="p-8 bg-white rounded-3xl border shadow-sm max-w-md">
            <h2 className="text-xl font-bold mb-4 text-zinc-900">Dashboard Error</h2>
            <p className="text-zinc-500 mb-4 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-2 font-bold"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium">Loading dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
