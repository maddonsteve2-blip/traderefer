"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ClientProviders } from "@/components/ClientProviders";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

export function AuthenticatedRuntimeShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <ClerkProvider>
      <GoogleAnalytics />
      <ClientProviders />
      <ConditionalLayout footer={footer}>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </ConditionalLayout>
    </ClerkProvider>
  );
}
