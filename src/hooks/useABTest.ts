"use client";

import { useEffect, useState } from "react";

// Read variant from cookie (set by middleware)
export function useABTest(experimentId: string): string {
  const [variant, setVariant] = useState("control");

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`ab_${experimentId}=`));
    if (cookie) setVariant(cookie.split("=")[1]);
  }, [experimentId]);

  return variant;
}

// Track a conversion event for an experiment
export function trackABConversion(experimentId: string, goal: string, value?: number) {
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`ab_${experimentId}=`));
  const variant = cookie ? cookie.split("=")[1] : "control";

  fetch("/api/ab/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ experimentId, variant, goal, value }),
  }).catch(() => {});

  // Also fire to GA4
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "ab_conversion", {
      experiment_id: experimentId,
      variant_id: variant,
      goal,
      value,
    });
  }
}
