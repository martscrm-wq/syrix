"use client";

import { useEffect, useState } from "react";
import { Users, Building2, Calculator, Megaphone, ShoppingCart, CheckCircle, RefreshCw } from "lucide-react";
import { BUILD_VERSION, BUILD_TIME } from "@/lib/build-info";

const modules = [
  { name: "الموارد البشرية", href: "/dashboard/hr", icon: Users, color: "bg-emerald-500", count: "إدارة الموظفين" },
  { name: "العمليات", href: "/dashboard/operations", icon: Building2, color: "bg-amber-500", count: "إدارة الأصول" },
  { name: "الحسابات", href: "/dashboard/accounts", icon: Calculator, color: "bg-blue-500", count: "النظام المحاسبي" },
  { name: "التسويق", href: "/dashboard/marketing", icon: Megaphone, color: "bg-purple-500", count: "الحملات وال Leads" },
  { name: "المبيعات", href: "/dashboard/sales", icon: ShoppingCart, color: "bg-rose-500", count: "خط سير العميل" },
];

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setUser(d?.user ?? null))
      .finally(() => setLoading(false));
  }, []);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 text-sm">
        <CheckCircle className="w-5 h-5 text-emerald-500" />
        <span className="text-slate-600">النظام محدث —</span>
        <span className="font-mono text-slate-500 text-xs" dir="ltr">{BUILD_VERSION}</span>
        <span className="text-slate-300 mx-1">|</span>
        <span className="font-mono text-slate-500 text-xs" dir="ltr">{BUILD_TIME}</span>
        <div className="mr-auto flex items-center gap-1 text-emerald-600">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
