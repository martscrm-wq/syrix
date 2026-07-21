"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, Download, CheckCircle, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface UpdateInfo {
  currentVersion: string;
  buildTime: string;
  remote: { sha: string; date: string; message: string; url: string } | null;
  error?: string;
}

export default function UpdateWidget() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState(false);
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { checkNow(); }, []);

  useEffect(() => {
    if (logEnd.current) logEnd.current.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const checkNow = async () => {
    setChecking(true);
    setInfo(null);
    try {
      const res = await fetch("/api/update/check");
      const data = await res.json();
      setInfo(data);
    } catch { /* ignore */ }
    setChecking(false);
  };

  const applyUpdate = async () => {
    setUpdating(true);
    setProgress(0);
    setLogs([]);
    setDone(false);

    try {
      const res = await fetch("/api/update/apply", { method: "POST" });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (line.startsWith("event: progress")) {
            const dataLine = lines[i + 1];
            if (dataLine?.startsWith("data: ")) {
              setProgress(parseInt(dataLine.slice(6)));
            }
          } else if (line.startsWith("event: log")) {
            const dataLine = lines[i + 1];
            if (dataLine?.startsWith("data: ")) {
              setLogs((prev) => [...prev, dataLine.slice(6)]);
            }
          } else if (line.startsWith("event: done")) {
            const dataLine = lines[i + 1];
            if (dataLine?.startsWith("data: ")) {
              setLogs((prev) => [...prev, `✅ ${dataLine.slice(6)}`]);
              setDone(true);
            }
          } else if (line.startsWith("event: error")) {
            const dataLine = lines[i + 1];
            if (dataLine?.startsWith("data: ")) {
              setLogs((prev) => [...prev, `❌ ${dataLine.slice(6)}`]);
              setDone(true);
            }
          }
        }
      }
    } catch {
      setLogs((prev) => [...prev, "❌ فشل الاتصال بخادم التحديث"]);
      setDone(true);
    }
    setUpdating(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-right hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {updating ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : done ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <RefreshCw className="w-5 h-5 text-slate-500" />
          )}
          <div className="text-right">
            <span className="font-medium text-slate-900">التحديثات</span>
            {info && !updating && (
              <p className="text-xs text-slate-400 mt-0.5">
                {info.currentVersion} — {info.buildTime}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {updating && (
            <div className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-mono">
              {progress}%
            </div>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {info?.error && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>لا يمكن التحقق من التحديثات — {info.error}</span>
            </div>
          )}

          {info?.remote && (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              <p>آخر تحديث على GitHub: <span className="font-mono text-xs text-slate-500">{info.remote.sha}</span></p>
              <p className="text-xs text-slate-400 mt-1">{info.remote.message}</p>
            </div>
          )}

          {updating && (
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {logs.length > 0 && (
            <div className="bg-slate-900 text-green-400 rounded-lg p-3 text-xs font-mono max-h-48 overflow-y-auto dir-ltr" dir="ltr">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
              <div ref={logEnd} />
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={checkNow} disabled={checking || updating}
              className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
              {checking ? "جاري الفحص..." : "فحص التحديثات"}
            </button>

            <button onClick={applyUpdate} disabled={updating}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {updating ? `جاري التحديث ${progress}%...` : "تحديث النظام"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
