import type { Metadata } from "next";
import { Inter, Outfit, Montserrat, Oswald } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { DirectoryFooter } from "@/components/DirectoryFooter";

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
          className={`${inter.variable} ${outfit.variable} ${montserrat.variable} ${oswald.variable} font-sans antialiased`}
        >
          <ConditionalLayout footer={<DirectoryFooter />}>
            {children}
          </ConditionalLayout>
          <Toaster position="top-center" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
