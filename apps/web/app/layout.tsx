import type { Metadata } from "next";
import { Inter, Outfit, Montserrat, Oswald } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { DirectoryFooter } from "@/components/DirectoryFooter";
import { NextStepWrapper } from "@/components/tour/NextStepWrapper";
import { PostHogPageView } from "@/components/PostHogPageView";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TradeRefer | Australia's Verified Trade Referral Marketplace",
  description: "Find ABN-verified tradespeople near you. Compare reviews, get free quotes, and earn 70% commission by referring. Australia's trusted trade referral marketplace.",
  openGraph: {
    title: "TradeRefer | Australia's Verified Trade Referral Marketplace",
    description: "Find ABN-verified tradespeople near you. Compare reviews, get free quotes, and earn by referring. Australia's trusted trade referral marketplace.",
    url: "https://traderefer.au",
    siteName: "TradeRefer",
    type: "website",
    images: [{ url: "https://traderefer.au/og-default.jpg", width: 1200, height: 630, alt: "TradeRefer — Australia's Verified Trade Referral Marketplace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeRefer | Australia's Verified Trade Referral Marketplace",
    description: "Find ABN-verified tradespeople near you. Earn 70% commission by referring. Australia's trusted trade referral marketplace.",
    images: ["https://traderefer.au/og-default.jpg"],
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
  "description": "Australia's verified trade referral marketplace. Find ABN-verified tradespeople, refer businesses, and earn commission.",
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
    <ClerkProvider>
      <html lang="en-AU" suppressHydrationWarning>
        <head>
          <link
            rel="preload"
            as="image"
            href="/images/hero-construction.jpg"
            fetchPriority="high"
          />
        </head>
        <body
          className={`${inter.variable} ${outfit.variable} ${montserrat.variable} ${oswald.variable} font-sans antialiased`}
        >
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
          <PostHogPageView />
          <NextStepWrapper>
            <ConditionalLayout footer={<DirectoryFooter />}>
              {children}
            </ConditionalLayout>
          </NextStepWrapper>
          <Toaster position="top-center" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
