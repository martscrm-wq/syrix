"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Edit2, Trash2, X, Search, Shield, Mail, Lock, Building } from "lucide-react";

const ROLES = [
  { value: "owner", label: "مالك" },
  { value: "super_admin", label: "مدير عام" },
  { value: "department_manager", label: "مدير قسم" },
  { value: "employee", label: "موظف" },
  { value: "accountant", label: "محاسب" },
];

const ROLES_FORM = ROLES.filter(r => r.value !== "owner");

const DEPARTMENTS = [
  { value: "hr", label: "الموارد البشرية" },
  { value: "ops", label: "العمليات" },
  { value: "accounts", label: "الحسابات" },
  { value: "marketing", label: "التسويق" },
  { value: "sales", label: "المبيعات" },
];

export default function UsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "employee",
    department: "hr",
    devPassword: "123456",
  });

  const fetchUsers = async (q = "") => {
    try {
      const url = q ? `/api/users?search=${encodeURIComponent(q)}` : "/api/users";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Fetch users error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: "", email: "", role: "employee", department: "hr", devPassword: "123456" });
    setShowForm(true);
    setError("");
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      devPassword: "",
    });
    setShowForm(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email) {
      setError("الاسم والبريد الإلكتروني مطلوبان");
      return;
    }

    try {
      const url = editUser ? `/api/users/${editUser.id}` : "/api/users";
      const method = editUser ? "PUT" : "POST";

      const body: any = {
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.department,
      };
      if (form.devPassword) body.devPassword = form.devPassword;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        fetchUsers(search);
      } else {
        const data = await res.json();
        setError(data.error || "حدث خطأ");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال");
    }
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`هل أنت متأكد من حذف "${user.name}"؟`)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchUsers(search);
      } else {
        const data = await res.json();
        setError(data.error || "فشل الحذف");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال");
    }
  };

  const getRoleLabel = (role: string) => ROLES.find(r => r.value === role)?.label || role;
  const getDeptLabel = (dept: string) => DEPARTMENTS.find(d => d.value === dept)?.label || dept;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-rose-100 text-rose-700";
      case "super_admin": return "bg-purple-100 text-purple-700";
      case "department_manager": return "bg-blue-100 text-blue-700";
      case "accountant": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">إدارة المستخدمين</h1>
        <p className="text-slate-500 mt-1">إضافة وتعديل وحذف حسابات المستخدمين</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 min-h-[44px]"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مستخدم</span>
        </button>
      </div>

      <div className="text-sm text-slate-500 mb-3">
        {total} مستخدم
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-right p-3 font-medium">الاسم</th>
                <th className="text-right p-3 font-medium">البريد الإلكتروني</th>
                <th className="text-center p-3 font-medium">الصلاحية</th>
                <th className="text-center p-3 font-medium">القسم</th>
                <th className="text-center p-3 font-medium">الحالة</th>
                <th className="text-center p-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-900">{user.name}</td>
                  <td className="p-3 text-slate-600">{user.email}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-600">{getDeptLabel(user.department)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {user.isActive ? "نشط" : "غير نشط"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button
                        onClick={() => openEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg min-h-[44px] min-w-[44px]"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg min-h-[44px] min-w-[44px]"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    {loading ? "جاري التحميل..." : "لا يوجد مستخدمون"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-card-view divide-y divide-slate-100">
          {users.map((user) => (
            <div key={user.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(user)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
                <span className="text-xs text-slate-500">{getDeptLabel(user.department)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">
                {editUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                  placeholder="اسم المستخدم"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.devPassword}
                    onChange={(e) => setForm({ ...form, devPassword: e.target.value })}
                    className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                    placeholder={editUser ? "اترك فارغ للاحتفاظ بالقديمة" : "كلمة المرور"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الصلاحية</label>
                <div className="relative">
                  <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] appearance-none"
                  >
                    {ROLES_FORM.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">القسم</label>
                <div className="relative">
                  <Building className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] appearance-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 min-h-[44px]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 min-h-[44px]"
                >
                  {editUser ? "تحديث" : "إضافة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
