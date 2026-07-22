"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calculator,
  Megaphone,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import type { PageId } from "@/lib/permissions";

const PAGE_TO_HREF: Record<PageId, string> = {
  dashboard: "/dashboard",
  hr: "/dashboard/hr",
  operations: "/dashboard/operations",
  accounts: "/dashboard/accounts",
  marketing: "/dashboard/marketing",
  sales: "/dashboard/sales",
  users: "/dashboard/users",
};

const PAGE_ICON: Record<PageId, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  hr: Users,
  operations: Building2,
  accounts: Calculator,
  marketing: Megaphone,
  sales: ShoppingCart,
  users: UserCog,
};

export default function Sidebar() {
  const t = useTranslations("sidebar");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [allowedPages, setAllowedPages] = useState<PageId[]>(["dashboard"]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.permissions) {
          setAllowedPages(data.user.permissions);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = allowedPages.map((pageId) => ({
    href: PAGE_TO_HREF[pageId],
    label: t(pageId),
    icon: PAGE_ICON[pageId],
  }));

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 md:hidden bg-white border border-slate-200 rounded-lg p-2 shadow-sm"
        aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 right-0 z-40 h-full w-64 bg-white border-l border-slate-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-900">SYRIX</h2>
                <p className="text-xs text-slate-500">{tc("appSubtitle")}</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && <ChevronLeft className="w-4 h-4 mr-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-200 space-y-1">
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{tc("logout")}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
