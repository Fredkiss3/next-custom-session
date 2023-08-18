"use client";
import { useRouter } from "next/navigation";
import * as React from "react";

/**
 * This component is needed because nextjs cache pages
 * and that means the flash message will always show.
 *
 * so we clear the flash message whenever we navigate away.
 * @param param0
 * @returns
 */
export function ClearFlash() {
  const router = useRouter();
  React.useEffect(() => {
    return () => {
      // Refresh the router because we don't want to keep old values on mount (errors, defaultValue)
      return React.startTransition(() => router.refresh());
    };
  }, [router]);
  return null;
}
