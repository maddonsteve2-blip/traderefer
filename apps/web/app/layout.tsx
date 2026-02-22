import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ConditionalLayout } from "@/components/ConditionalLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeRefer | Australia's Verified Trade Referral Marketplace",
  description: "Refer leads, earn money. Unlock verified trade leads for your business. The trusted marketplace for Geelong and beyond.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${outfit.variable} font-sans antialiased text-zinc-900 bg-white`}
        >
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Toaster position="top-center" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
