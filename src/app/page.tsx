"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return null;
}
