"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminGate } from "@/components/auth/AdminGate";

/** Old tab URLs redirect to the combined Overview options page. */
function OverviewKindRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/overview/");
  }, [router]);

  return (
    <p className="p-8 text-center text-sm text-stone-500">
      Opening Overview options…
    </p>
  );
}

export default function OverviewKindAdminPage() {
  return (
    <AdminGate>
      <OverviewKindRedirect />
    </AdminGate>
  );
}
