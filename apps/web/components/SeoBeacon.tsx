"use client";

import { useEffect } from "react";
import { isAnonymousSeoPath } from "@/lib/public-routes";

// Featherweight analytics for the SEO/directory pages, where posthog-js is
// deliberately NOT loaded (bundle-weight doctrine — see instrumentation-
// client.ts). Sends anonymous events straight to the existing /ingest
// reverse proxy: one $pageview on mount plus register-CTA clicks. Events are
// anonymous ($process_person_profile: false) so they cost the cheap event
// rate and create no person profiles; the shared tr_anon_id localStorage key
// lets posthog-js continue the same identity once the visitor reaches
// /register (see the bootstrap in instrumentation-client.ts), joining the
// SEO page -> register funnel.
const ANON_KEY = "tr_anon_id";

function anonId(): string {
    try {
        let id = localStorage.getItem(ANON_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(ANON_KEY, id);
        }
        return id;
    } catch {
        return "anon-no-storage";
    }
}

function pageContext(pathname: string) {
    // /local/{state}/{city}/{suburb}/{trade}/{job}
    const m = pathname.match(/^\/local\/([^/]+)\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?(?:\/([^/]+))?$/);
    if (!m) {
        if (pathname.startsWith("/top/")) return { page_type: "top" };
        if (pathname.startsWith("/b/")) return { page_type: "profile" };
        if (pathname === "/") return { page_type: "home" };
        return { page_type: "other" };
    }
    const [, state, city, suburb, trade, job] = m;
    const page_type = job ? "job" : trade ? "trade" : suburb ? "suburb" : "city";
    return { page_type, seo_state: state, seo_city: city, seo_suburb: suburb, seo_trade: trade, seo_job: job };
}

function send(event: string, props: Record<string, unknown>) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    const body = JSON.stringify({
        api_key: key,
        event,
        distinct_id: anonId(),
        timestamp: new Date().toISOString(),
        properties: {
            $process_person_profile: false,
            $lib: "tr-seo-beacon",
            $current_url: location.href,
            $pathname: location.pathname,
            $host: location.host,
            $referrer: document.referrer || undefined,
            title: document.title,
            ...props,
        },
    });
    // sendBeacon survives the navigation a CTA click triggers.
    if (!navigator.sendBeacon?.("/ingest/capture/", new Blob([body], { type: "application/json" }))) {
        void fetch("/ingest/capture/", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
}

export function SeoBeacon() {
    useEffect(() => {
        if (!isAnonymousSeoPath(location.pathname)) return; // posthog-js owns app paths
        const ctx = pageContext(location.pathname);
        send("$pageview", ctx);

        const onClick = (e: MouseEvent) => {
            const a = (e.target as Element | null)?.closest?.('a[href^="/register"]');
            if (!a) return;
            send("register_cta_click", { ...ctx, cta_href: a.getAttribute("href") });
        };
        document.addEventListener("click", onClick, { capture: true });
        return () => document.removeEventListener("click", onClick, { capture: true });
    }, []);
    return null;
}
