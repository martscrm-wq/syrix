"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Building2, Calculator, Megaphone, ShoppingCart, CheckCircle, RefreshCw } from "lucide-react";
import { BUILD_VERSION, BUILD_TIME } from "@/lib/build-info";
import { useLocale } from "@/lib/locale-context";
import UpdateWidget from "./UpdateWidget";

const moduleConfigs = [
  { href: "/dashboard/hr", icon: Users, color: "bg-emerald-500", key: "employees" },
  { href: "/dashboard/operations", icon: Building2, color: "bg-amber-500", key: "assets" },
  { href: "/dashboard/accounts", icon: Calculator, color: "bg-blue-500", key: "accounting" },
  { href: "/dashboard/marketing", icon: Megaphone, color: "bg-purple-500", key: "campaigns" },
  { href: "/dashboard/sales", icon: ShoppingCart, color: "bg-rose-500", key: "salesPipeline" },
];

export default function DashboardPage() {
  const td = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { locale } = useLocale();
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
        <h1 className="text-2xl font-bold text-slate-900">{td("title")}</h1>
        <p className="text-slate-500 mt-1">
          {tc("welcome")}{user?.name ? `، ${user.name}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {moduleConfigs.map((mod) => (
          <a
            key={mod.href}
            href={mod.href}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className={`w-12 h-12 ${mod.color} rounded-xl flex items-center justify-center mb-3`}>
              <mod.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900">{td(mod.key)}</h3>
          </a>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 text-sm mb-4">
        <CheckCircle className="w-5 h-5 text-emerald-500" />
        <span className="text-slate-600">{tc("systemUpdated")} —</span>
        <span className="font-mono text-slate-500 text-xs" dir="ltr">{BUILD_VERSION}</span>
        <span className="text-slate-300 mx-1">|</span>
        <span className="font-mono text-slate-500 text-xs" dir="ltr">{BUILD_TIME}</span>
        <div className="mr-auto flex items-center gap-1 text-emerald-600">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>100%</span>
        </div>
      </div>

      <UpdateWidget />
    </div>
  );
}
