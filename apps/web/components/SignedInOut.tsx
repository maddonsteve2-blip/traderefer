"use client";

import { useAuth } from "@clerk/nextjs";

interface SignedInOutProps {
  signedIn: React.ReactNode;
  signedOut: React.ReactNode;
}

export function SignedInOut({ signedIn, signedOut }: SignedInOutProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    // Show signed-out state while loading to avoid layout shift
    return <>{signedOut}</>;
  }

  return <>{isSignedIn ? signedIn : signedOut}</>;
}
