"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Users, Building2, Calculator, Megaphone, ShoppingCart } from "lucide-react";

const modules = [
  { name: "الموارد البشرية", href: "/dashboard/hr", icon: Users, color: "bg-emerald-500", count: "إدارة الموظفين" },
  { name: "العمليات", href: "/dashboard/operations", icon: Building2, color: "bg-amber-500", count: "إدارة الأصول" },
  { name: "الحسابات", href: "/dashboard/accounts", icon: Calculator, color: "bg-blue-500", count: "النظام المحاسبي" },
  { name: "التسويق", href: "/dashboard/marketing", icon: Megaphone, color: "bg-purple-500", count: "الحملات وال Leads" },
  { name: "المبيعات", href: "/dashboard/sales", icon: ShoppingCart, color: "bg-rose-500", count: "خط سير العميل" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser({ email: firebaseUser.email || "" });
        }
      } catch {
        setUser({ email: firebaseUser.email || "" });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
        <p className="text-slate-500 mt-1">
          مرحبًا{user?.name ? `، ${user.name}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <a
            key={mod.href}
            href={mod.href}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className={`w-12 h-12 ${mod.color} rounded-xl flex items-center justify-center mb-3`}>
              <mod.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900">{mod.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{mod.count}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
