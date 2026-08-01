import type { Metadata } from "next";
import { Inter, Outfit, Montserrat, Oswald } from "next/font/google";
import "./globals.css";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { RuntimeShell } from "@/components/RuntimeShell";
import { SeoBeacon } from "@/components/SeoBeacon";
import { buildOgImageUrl } from "@/lib/og-image";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "optional",
  weight: ["400", "600", "700", "800", "900"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

const defaultOgImage = buildOgImageUrl({
  template: "home",
  title: "Australia's trade referral marketplace",
  subtitle: "Find ABN-checked trade profiles, compare local options and receive rewards for eligible referrals.",
  eyebrow: "TradeRefer",
  badge: "Trade directory",
  stat1: "ABN-checked",
  stat2: "Local referrals",
  stat3: "Free quotes",
});

export const metadata: Metadata = {
  title: "TradeRefer | Trade Referrals Australia",
  description: "Find ABN-checked trade profiles near you, compare reviews, request free quotes, and receive rewards for eligible referrals.",
  // Explicit icon links: app/icon.png never resolves in production because the
  // (public)/[slug] catch-all route intercepts /icon.png, so point at public/
  // assets which are served ahead of dynamic routes.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "640x640" },
    ],
    apple: [{ url: "/favicon.png", type: "image/png", sizes: "640x640" }],
  },
  openGraph: {
    title: "TradeRefer | Australia's Trade Referral Marketplace",
    description: "Find ABN-checked trade profiles near you, compare reviews, request free quotes, and receive rewards for eligible referrals.",
    url: "https://traderefer.au",
    siteName: "TradeRefer",
    type: "website",
    images: [{ url: defaultOgImage, width: 1200, height: 630, alt: "TradeRefer - Australia's trade referral marketplace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeRefer | Australia's Trade Referral Marketplace",
    description: "Find ABN-checked trade profiles near you, compare reviews, request free quotes, and receive rewards for eligible referrals.",
    images: [defaultOgImage],
  },
  alternates: { canonical: "https://traderefer.au" },
  other: {
    "geo.region": "AU",
    "geo.placename": "Australia",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TradeRefer",
  "url": "https://traderefer.au",
  "logo": "https://traderefer.au/logo.png",
  "description": "Australia's trade referral marketplace. Find ABN-checked trade profiles, compare local options, and receive rewards for eligible referrals.",
  "sameAs": ["https://www.facebook.com/traderefer", "https://www.instagram.com/traderefer"]
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TradeRefer",
  "url": "https://traderefer.au",
  "potentialAction": {
    "@type": "SearchAction",
    "target": { "@type": "EntryPoint", "urlTemplate": "https://traderefer.au/businesses?q={search_term_string}" },
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} ${montserrat.variable} ${oswald.variable} font-sans antialiased`}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <SeoBeacon />
        <RuntimeShell footer={<DirectoryFooter />}>
          {children}
        </RuntimeShell>
      </body>
    </html>
  );
}
