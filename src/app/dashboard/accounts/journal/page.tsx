"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Edit2, X, Search, FileText, Copy, CheckCircle,
  ChevronDown, ChevronUp, Filter, Download, AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { JOURNAL_TEMPLATES, type JournalTemplate } from "@/lib/journal-templates";

interface Account { id: string; code: string; nameAr: string; type: string; }
interface JournalLine { id?: string; accountId: string; debit: number; credit: number; account?: Account; description?: string; }
interface JournalEntry { id: string; entryDate: string; description: string; reference?: string; lines: JournalLine[]; createdAt: string; }

const CATEGORY_LABELS: Record<string, string> = {
  opening: "قيود البدء", operating: "قيود تشغيلية", adjusting: "قيود تسوية",
  closing: "قيود إقفال", reversing: "قيود عكسية", advanced: "قيود متقدمة",
};

export default function JournalEntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const [form, setForm] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    description: "",
    reference: "",
    lines: [
      { accountId: "", debit: 0, credit: 0, description: "" },
      { accountId: "", debit: 0, credit: 0, description: "" },
    ] as { accountId: string; debit: number; credit: number; description: string }[],
  });

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts/trial-balance?year=2026&month=1");
      if (res.ok) {
        const data = await res.json();
        if (data.accounts) setAccounts(data.accounts.map((a: any) => ({ id: a.accountId, code: a.accountCode, nameAr: a.accountName, type: "" })));
      }
    } catch {}
    // Fallback: fetch from a simple endpoint or use hardcoded list
    if (accounts.length === 0) {
      try {
        const res = await fetch("/api/accounts/journal-entries?limit=1");
        if (res.ok) {
          const data = await res.json();
          if (data.entries?.[0]?.lines?.[0]?.account) {
            const accs = new Map<string, Account>();
            data.entries.forEach((e: JournalEntry) => e.lines.forEach((l: JournalLine) => { if (l.account) accs.set(l.account.id, l.account); }));
            setAccounts(Array.from(accs.values()));
          }
        }
      } catch {}
    }
  };

  const fetchEntries = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/accounts/journal-entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchAccounts(); }, []);
  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const resetForm = () => {
    setForm({
      entryDate: new Date().toISOString().split("T")[0],
      description: "", reference: "",
      lines: [
        { accountId: "", debit: 0, credit: 0, description: "" },
        { accountId: "", debit: 0, credit: 0, description: "" },
      ],
    });
    setEditEntry(null);
    setError("");
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = (entry: JournalEntry) => {
    setEditEntry(entry);
    setForm({
      entryDate: entry.entryDate.split("T")[0],
      description: entry.description,
      reference: entry.reference || "",
      lines: entry.lines.map(l => ({
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        description: l.description || "",
      })),
    });
    setShowForm(true);
  };

  const applyTemplate = (template: JournalTemplate) => {
    setForm(prev => ({
      ...prev,
      description: template.description,
      lines: template.lines.map(l => ({
        accountId: l.accountId,
        debit: l.side === "debit" ? (l.defaultAmount || 0) : 0,
        credit: l.side === "credit" ? (l.defaultAmount || 0) : 0,
        description: l.label,
      })),
    }));
  };

  const addLine = () => {
    setForm(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: "", debit: 0, credit: 0, description: "" }],
    }));
  };

  const removeLine = (index: number) => {
    if (form.lines.length <= 2) return;
    setForm(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== index) }));
  };

  const updateLine = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      lines: prev.lines.map((l, i) => i === index ? { ...l, [field]: value } : l),
    }));
  };

  const totalDebit = form.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + (l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!form.description) { setError("البيان الوصفي مطلوب"); return; }
    if (form.lines.length < 2) { setError("يجب أن يكون القيد على الأقل بندان"); return; }
    if (!isBalanced) { setError(`القيد غير متوازن: المدين ${formatCurrency(totalDebit)} ≠ الدائن ${formatCurrency(totalCredit)}`); return; }

    const validLines = form.lines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) { setError("يجب إدخال مبلغ مدين أو دائن على الأقل لبندَين"); return; }

    try {
      const url = editEntry ? `/api/accounts/journal-entries/${editEntry.id}` : "/api/accounts/journal-entries";
      const method = editEntry ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate: form.entryDate,
          description: form.description,
          reference: form.reference,
          lines: validLines.map(l => ({ accountId: l.accountId, debit: l.debit || 0, credit: l.credit || 0, description: l.description })),
        }),
      });
      if (res.ok) {
        setShowForm(false); resetForm(); fetchEntries();
        setSuccess(editEntry ? "تم تعديل القيد بنجاح" : "تم إنشاء القيد بنجاح");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "حدث خطأ");
      }
    } catch { setError("حدث خطأ في الاتصال"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القيد؟")) return;
    try {
      const res = await fetch(`/api/accounts/journal-entries/${id}`, { method: "DELETE" });
      if (res.ok) { fetchEntries(); setSuccess("تم حذف القيد"); setTimeout(() => setSuccess(""), 3000); }
    } catch { setError("فشل الحذف"); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.size} قيد؟`)) return;
    try {
      const res = await fetch("/api/accounts/journal-entries/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (res.ok) { setSelectedIds(new Set()); fetchEntries(); setSuccess(`تم حذف ${selectedIds.size} قيد`); setTimeout(() => setSuccess(""), 3000); }
    } catch { setError("فشل الحذف المجمع"); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEntries.length) { setSelectedIds(new Set()); }
    else { setSelectedIds(new Set(filteredEntries.map(e => e.id))); }
  };

  const filteredEntries = entries.filter(e => {
    if (filterCategory !== "all") {
      const desc = e.description.toLowerCase();
      const catMatch =
        (filterCategory === "opening" && (desc.includes("بدء") || desc.includes("رأس المال") || desc.includes("افتتاح"))) ||
        (filterCategory === "operating" && (desc.includes("بيع") || desc.includes("شراء") || desc.includes("دفع") || desc.includes("تحصيل") || desc.includes("إيداع") || desc.includes("صرف") || desc.includes("رواتب") || desc.includes("إيجار"))) ||
        (filterCategory === "adjusting" && (desc.includes("إهلاك") || desc.includes("استحقاق") || desc.includes("تسوية") || desc.includes("ضريبة مؤجلة"))) ||
        (filterCategory === "closing" && (desc.includes("إقفال") || desc.includes("ملخص الدخل"))) ||
        (filterCategory === "reversing" && desc.includes("عكس")) ||
        (filterCategory === "advanced" && (desc.includes("إعادة تقييم") || desc.includes("شهرة") || desc.includes("استحواذ")));
      if (!catMatch) return false;
    }
    return true;
  });

  const groupedTemplates = JOURNAL_TEMPLATES.reduce((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {} as Record<string, JournalTemplate[]>);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">دفتر اليومية العامة</h1>
        <p className="text-slate-500 mt-1">إدارة القيود المحاسبية - إضافة وتعديل وحذف</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex items-center justify-between">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</span>
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm border border-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</span>
          <button onClick={() => setSuccess("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="بحث في القيود..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 min-h-[44px]" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm min-h-[44px]">
          <option value="all">كل الأنواع</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {selectedIds.size > 0 && (
          <button onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 min-h-[44px]">
            <Trash2 className="w-4 h-4" />حذف ({selectedIds.size})
          </button>
        )}
        <button onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 min-h-[44px]">
          <Plus className="w-4 h-4" />إضافة قيد
        </button>
      </div>

      <div className="text-sm text-slate-500 mb-3">{filteredEntries.length} قيد</div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="p-3 w-10">
                  <input type="checkbox" checked={selectedIds.size === filteredEntries.length && filteredEntries.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="text-right p-3 font-medium">التاريخ</th>
                <th className="text-right p-3 font-medium">البيان</th>
                <th className="text-right p-3 font-medium">المستند</th>
                <th className="text-center p-3 font-medium">المدين</th>
                <th className="text-center p-3 font-medium">الدائن</th>
                <th className="text-center p-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(entry => {
                const totalD = entry.lines.reduce((s, l) => s + l.debit, 0);
                const totalC = entry.lines.reduce((s, l) => s + l.credit, 0);
                const isExpanded = expandedEntry === entry.id;
                return (
                  <Fragment key={entry.id}>
                    <tr className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <input type="checkbox" checked={selectedIds.has(entry.id)} onChange={() => toggleSelect(entry.id)} className="rounded" />
                      </td>
                      <td className="p-3 text-slate-900">{new Date(entry.entryDate).toLocaleDateString("ar-EG")}</td>
                      <td className="p-3 text-slate-900 max-w-xs truncate">{entry.description}</td>
                      <td className="p-3 text-slate-500">{entry.reference || "-"}</td>
                      <td className="p-3 text-center font-medium text-slate-900">{formatCurrency(totalD)}</td>
                      <td className="p-3 text-center font-medium text-slate-900">{formatCurrency(totalC)}</td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => setExpandedEntry(isExpanded ? null : entry.id)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg" title="تفاصيل">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(entry)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="تعديل"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(entry.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="حذف"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="p-4">
                          <div className="space-y-1">
                            {entry.lines.map((line, i) => (
                              <div key={i} className="flex items-center gap-4 text-sm">
                                <span className="w-8 text-center text-slate-400">{i + 1}</span>
                                <span className="flex-1 text-slate-700">
                                  {line.debit > 0 ? "من" : "　إلى"} حـ/ {line.account?.nameAr || line.accountId}
                                </span>
                                {line.description && <span className="text-slate-500 text-xs">({line.description})</span>}
                                <span className="w-28 text-left font-medium">{line.debit > 0 ? formatCurrency(line.debit) : ""}</span>
                                <span className="w-28 text-left font-medium">{line.credit > 0 ? formatCurrency(line.credit) : ""}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-slate-400">{loading ? "جاري التحميل..." : "لا توجد قيود"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl mb-10">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">{editEntry ? "تعديل القيد" : "إضافة قيد جديد"}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <label className="block text-sm font-medium text-slate-700 mb-2">قالب جاهز (اختياري)</label>
              <select onChange={e => { if (e.target.value) { const t = JOURNAL_TEMPLATES.find(t => t.id === e.target.value); if (t) applyTemplate(t); } e.target.value = ""; }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm min-h-[44px]">
                <option value="">-- اختر قالباً --</option>
                {Object.entries(groupedTemplates).map(([cat, templates]) => (
                  <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat}>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.nameAr}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ</label>
                  <input type="date" value={form.entryDate} onChange={e => setForm({ ...form, entryDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm min-h-[44px]" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم المستند</label>
                  <input type="text" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm min-h-[44px]" placeholder="فاتورة / إيصال / كشف" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">البيان الوصفي</label>
                  <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm min-h-[44px]" placeholder="شرح القيد..." required />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">بنود القيد</label>
                  <button type="button" onClick={addLine} className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700">
                    <Plus className="w-4 h-4" />إضافة بند
                  </button>
                </div>

                <div className="space-y-2">
                  {form.lines.map((line, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">الحساب</label>
                        <select value={line.accountId} onChange={e => updateLine(index, "accountId", e.target.value)}
                          className="w-full px-2 py-2 border border-slate-200 rounded text-sm min-h-[40px]">
                          <option value="">اختر الحساب</option>
                          {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.nameAr}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 mb-1 block">البيان</label>
                        <input type="text" value={line.description} onChange={e => updateLine(index, "description", e.target.value)}
                          className="w-full px-2 py-2 border border-slate-200 rounded text-sm min-h-[40px]" placeholder="وصف البند" />
                      </div>
                      <div className="w-32">
                        <label className="text-xs text-slate-500 mb-1 block">مدين</label>
                        <input type="number" min="0" step="0.01" value={line.debit || ""}
                          onChange={e => updateLine(index, "debit", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 border border-slate-200 rounded text-sm text-left min-h-[40px]" placeholder="0" />
                      </div>
                      <div className="w-32">
                        <label className="text-xs text-slate-500 mb-1 block">دائن</label>
                        <input type="number" min="0" step="0.01" value={line.credit || ""}
                          onChange={e => updateLine(index, "credit", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-2 border border-slate-200 rounded text-sm text-left min-h-[40px]" placeholder="0" />
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={() => removeLine(index)} disabled={form.lines.length <= 2}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded disabled:opacity-30 min-h-[40px]">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-3 p-3 bg-slate-100 rounded-lg text-sm">
                  <div className="flex gap-6">
                    <span>المدين: <strong>{formatCurrency(totalDebit)}</strong></span>
                    <span>الدائن: <strong>{formatCurrency(totalCredit)}</strong></span>
                  </div>
                  <span className={`font-bold ${isBalanced ? "text-emerald-600" : "text-rose-600"}`}>
                    {isBalanced ? "متوازن ✓" : `فرق: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px]">إلغاء</button>
                <button type="submit" disabled={!isBalanced}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed">
                  {editEntry ? "تحديث القيد" : "تسجيل القيد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { Fragment } from "react";
