"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { isAnonymousSeoPath } from "@/lib/public-routes";

export function GoogleAnalytics() {
  const pathname = usePathname();

  if (isAnonymousSeoPath(pathname)) return null;

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-YQ1SSL3MQF"
        strategy="lazyOnload"
      />
      <Script id="gtag-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-YQ1SSL3MQF');
        `}
      </Script>
    </>
  );
}
