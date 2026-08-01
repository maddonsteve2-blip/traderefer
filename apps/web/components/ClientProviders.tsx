"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { isAnonymousSeoPath } from "@/lib/public-routes";

const PostHogPageView = dynamic(
  () => import("@/components/PostHogPageView").then((m) => m.PostHogPageView),
  { ssr: false }
);

const Toaster = dynamic(
  () => import("sonner").then((m) => ({ default: m.Toaster })),
  { ssr: false }
);

export function ClientProviders() {
  const pathname = usePathname();

  if (isAnonymousSeoPath(pathname)) return null;

  return (
    <>
      <PostHogPageView />
      <Toaster position="top-center" richColors />
    </>
  );
}
