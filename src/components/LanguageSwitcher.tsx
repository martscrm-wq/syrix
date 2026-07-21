"use client";

import { Globe } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { locales, localeNames } from "@/i18n/config";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const toggle = () => {
    const idx = locales.indexOf(locale);
    const next = locales[(idx + 1) % locales.length];
    setLocale(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      title={localeNames[locale]}
    >
      <Globe className="w-4 h-4" />
      <span>{localeNames[locale]}</span>
    </button>
  );
}
