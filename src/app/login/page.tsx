"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Building2, Lock, Mail, AlertCircle, WifiOff, User } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("login");
  const tc = useTranslations("common");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devMode, setDevMode] = useState(false);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("errorGeneric"));
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally { setLoading(false); }
  };

  const handleFirebaseLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("auth/")) setDevMode(true);
      else setError(msg || t("errorGeneric"));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SYRIX</h1>
          <p className="text-slate-500 mt-1">{tc("appSubtitle")}</p>
        </div>

        {devMode && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <WifiOff className="w-5 h-5" />
              <span className="font-medium">{t("devModeTitle")}</span>
            </div>
            <p className="text-sm text-amber-600">{t("devModeDesc")}</p>
          </div>
        )}

        <form onSubmit={handleLocalLogin} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">{tc("email")}</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder={t("emailPlaceholder")} required dir="ltr" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">{tc("password")}</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder={t("passwordPlaceholder")} required dir="ltr" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors min-h-[44px]">
            {loading ? tc("loading") : t("submit")}
          </button>

          <div className="text-center text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-center gap-1"><User className="w-3 h-3" /> <span>{t("devAccounts")}</span></div>
            <p><span dir="ltr" className="font-mono">admin@syrix.com</span> — <span dir="ltr" className="font-mono">سش12345</span> <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] mr-1">{t("superAdmin")}</span></p>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">SYRIX v0.1 — {tc("appSubtitle")}</p>
      </div>
    </div>
  );
}
