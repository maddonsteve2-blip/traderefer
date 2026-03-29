"use client";

import dynamic from "next/dynamic";

const PostHogPageView = dynamic(
  () => import("@/components/PostHogPageView").then((m) => m.PostHogPageView),
  { ssr: false }
);

const Toaster = dynamic(
  () => import("sonner").then((m) => ({ default: m.Toaster })),
  { ssr: false }
);

export function ClientProviders() {
  return (
    <>
      <PostHogPageView />
      <Toaster position="top-center" richColors />
    </>
  );
}
