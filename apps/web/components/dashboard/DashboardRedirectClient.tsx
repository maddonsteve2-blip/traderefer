"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function DashboardRedirectClient() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const hasRedirected = useRef(false);

  useEffect(() => {
    console.log("DashboardRedirect: Effect triggered", { isLoaded, isSignedIn });
    
    // Wait for auth to load
    if (!isLoaded) {
      setStatus("Loading auth...");
      return;
    }

    // If not signed in, redirect to login
    if (!isSignedIn) {
      console.log("DashboardRedirect: Not signed in, redirecting to login");
      setStatus("Not signed in, redirecting...");
      router.push("/login");
      return;
    }

    // Prevent multiple redirect attempts using ref
    if (hasRedirected.current) {
      console.log("DashboardRedirect: Already redirected, skipping");
      return;
    }
    hasRedirected.current = true;

    const checkAuthStatus = async () => {
      setStatus("Checking auth status...");
      try {
        const token = await getToken();
        console.log("DashboardRedirect: Got token", token ? "yes" : "no");
        
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        console.log("DashboardRedirect: API base", apiBase);

        setStatus("Fetching user status...");
        const res = await fetch(`${apiBase}/auth/status`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("DashboardRedirect: API response status", res.status);

        if (res.ok) {
          const data = await res.json();
          console.log("DashboardRedirect: User data", data);

          if (data.has_business) {
            setStatus("Redirecting to business dashboard...");
            router.push("/dashboard/business");
          } else if (data.has_referrer) {
            setStatus("Redirecting to referrer dashboard...");
            router.push("/dashboard/referrer");
          } else {
            setStatus("Redirecting to onboarding...");
            router.push("/onboarding");
          }
        } else if (res.status === 401) {
          console.log("DashboardRedirect: 401 unauthorized");
          setStatus("Session expired, redirecting to login...");
          router.push("/login");
        } else {
          const errorText = await res.text();
          console.error("DashboardRedirect: API error", res.status, errorText);
          setError(`API error: ${res.status} - ${errorText}`);
        }
      } catch (err) {
        console.error("DashboardRedirect: Auth status check failed:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };

    // Small delay to ensure auth is fully ready
    const timer = setTimeout(checkAuthStatus, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]); // Only run when auth state changes

  // Show loading state while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="text-center max-w-md w-full">
        {error ? (
          <div className="p-8 bg-white rounded-3xl border shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-zinc-900">Dashboard Error</h2>
            <p className="text-zinc-500 mb-4 text-sm font-mono bg-red-50 p-3 rounded-lg">{error}</p>
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
            <p className="text-zinc-500 font-medium">{status}</p>
            <p className="text-xs text-zinc-400 font-mono">isLoaded: {isLoaded ? "yes" : "no"} | isSignedIn: {isSignedIn ? "yes" : "no"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
