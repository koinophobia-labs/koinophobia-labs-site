"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function PendingJobRefresh() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      if (++n > 20) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [router]);
  return (
    <p>
      Your payment is being confirmed. This page will update with your secure
      onboarding link; it will also arrive by email. Contact Blake if it does
      not appear shortly.
    </p>
  );
}
