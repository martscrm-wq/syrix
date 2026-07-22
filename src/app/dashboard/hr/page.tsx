"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Users, Clock, CalendarDays, DollarSign, UserPlus, LogIn, LogOut, CheckCircle, XCircle, Plus } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(amount);

const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(d));

export default function HRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"employees" | "attendance" | "leaves" | "salaries">("employees");
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [todayStatus, setTodayStatus] = useState<{ checkedIn: boolean; checkedOut: boolean }>({ checkedIn: false, checkedOut: false });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push("/login"); return; }
      try {
        const [empRes, attRes, leaveRes, salRes] = await Promise.all([
          fetch("/api/hr/employees?limit=50"),
          fetch(`/api/hr/attendance?month=${month}&year=${year}&limit=50`),
          fetch("/api/hr/leaves?limit=50"),
          fetch(`/api/hr/salaries?month=${month}&year=${year}&limit=50`),
        ]);

        if (empRes.ok) { const d = await empRes.json(); setEmployees(d.employees || []); }
        if (attRes.ok) { const d = await attRes.json(); setAttendanceRecords(d.records || []); }
        if (leaveRes.ok) { const d = await leaveRes.json(); setLeaves(d.leaves || []); }
        if (salRes.ok) { const d = await salRes.json(); setSalaries(d.salaries || []); }

        // Check today's attendance
        const todayRecords = (await attRes.ok ? (await attRes.json()).records || [] : []).filter(
          (r: any) => new Date(r.date).toDateString() === now.toDateString()
        );
        if (todayRecords.length > 0) {
          setTodayStatus({
            checkedIn: !!todayRecords[0].checkIn,
            checkedOut: !!todayRecords[0].checkOut,
          });
        }
      } catch (err) { console.error("HR fetch error:", err); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router, month, year]);

  const handleAttendance = async (action: "checkin" | "checkout") => {
    try {
      const res = await fetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        if (action === "checkin") setTodayStatus({ checkedIn: true, checkedOut: false });
        if (action === "checkout") setTodayStatus({ checkedIn: true, checkedOut: true });
      } else {
        const data = await res.json();
        setError(data.error);
        setTimeout(() => setError(""), 3000);
      }
    } catch { setError("فشل الاتصال"); }
  };

  const handleLeaveAction = async (id: string, status: string) => {
    await fetch(`/api/hr/leaves/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const res = await fetch("/api/hr/leaves?limit=50");
    if (res.ok) { const d = await res.json(); setLeaves(d.leaves || []); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">الموارد البشرية</h1>
        <p className="text-slate-500 mt-1">إدارة الموظفين، الحضور، الإجازات، والمرتبات</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button onClick={() => handleAttendance("checkin")} disabled={todayStatus.checkedIn}
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all disabled:opacity-50 text-right">
          <LogIn className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-sm font-medium text-slate-900">تسجيل حضور</p>
          <p className="text-xs text-slate-400">{todayStatus.checkedIn ? "تم التسجيل" : "اضغط للتسجيل"}</p>
        </button>
        <button onClick={() => handleAttendance("checkout")} disabled={!todayStatus.checkedIn || todayStatus.checkedOut}
          className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all disabled:opacity-50 text-right">
          <LogOut className="w-5 h-5 text-rose-600 mb-2" />
          <p className="text-sm font-medium text-slate-900">تسجيل انصراف</p>
          <p className="text-xs text-slate-400">{todayStatus.checkedOut ? "تم التسجيل" : todayStatus.checkedIn ? "اضغط للتسجيل" : "سجل الحضور أولاً"}</p>
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <Users className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-slate-900">إجمالي الموظفين</p>
          <p className="text-lg font-bold text-slate-900">{employees.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-right">
          <CalendarDays className="w-5 h-5 text-amber-600 mb-2" />
          <p className="text-sm font-medium text-slate-900">طلبات الإجازة</p>
          <p className="text-lg font-bold text-slate-900">{leaves.filter(l => l.status === "pending").length}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 overflow-x-auto">
        {[
          { key: "employees" as const, label: "الموظفين", icon: Users },
          { key: "attendance" as const, label: "الحضور", icon: Clock },
          { key: "leaves" as const, label: "الإجازات", icon: CalendarDays },
          { key: "salaries" as const, label: "المرتبات", icon: DollarSign },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
              activeTab === tab.key ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}>
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Employees Tab */}
      {activeTab === "employees" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900">قائمة الموظفين</h2>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 min-h-[44px]">
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-right p-3 font-medium">الاسم</th>
                  <th className="text-right p-3 font-medium">الوظيفة</th>
                  <th className="text-right p-3 font-medium">القسم</th>
                  <th className="text-left p-3 font-medium">الراتب الأساسي</th>
                  <th className="text-center p-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{emp.fullNameAr}</td>
                    <td className="p-3 text-slate-600">{emp.position}</td>
                    <td className="p-3 text-slate-600">{emp.department}</td>
                    <td className="p-3 text-left text-slate-900">{formatCurrency(emp.basicSalary)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {emp.isActive ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400">لا يوجد موظفون</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-card-view divide-y divide-slate-100">
            {employees.map((emp) => (
              <div key={emp.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">{emp.fullNameAr}</p>
                    <p className="text-xs text-slate-500">{emp.position} - {emp.department}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {emp.isActive ? "نشط" : "غير نشط"}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-1">{formatCurrency(emp.basicSalary)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">سجل الحضور والانصراف</h2>
          </div>
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-right p-3 font-medium">التاريخ</th>
                  <th className="text-center p-3 font-medium">حضور</th>
                  <th className="text-center p-3 font-medium">انصراف</th>
                  <th className="text-center p-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map((rec) => (
                  <tr key={rec.id} className="border-t border-slate-100">
                    <td className="p-3 text-slate-900">{formatDate(rec.date)}</td>
                    <td className="p-3 text-center text-slate-900">{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString("ar-EG") : "-"}</td>
                    <td className="p-3 text-center text-slate-900">{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString("ar-EG") : "-"}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.status === "present" ? "bg-emerald-100 text-emerald-700" :
                        rec.status === "late" ? "bg-amber-100 text-amber-700" :
                        rec.status === "absent" ? "bg-rose-100 text-rose-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {rec.status === "present" ? "حاضر" : rec.status === "late" ? "متأخر" : rec.status === "absent" ? "غائب" : "نصف يوم"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leaves Tab */}
      {activeTab === "leaves" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">طلبات الإجازات</h2>
          </div>
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-right p-3 font-medium">الموظف</th>
                  <th className="text-right p-3 font-medium">النوع</th>
                  <th className="text-right p-3 font-medium">من</th>
                  <th className="text-right p-3 font-medium">إلى</th>
                  <th className="text-center p-3 font-medium">أيام</th>
                  <th className="text-center p-3 font-medium">الحالة</th>
                  <th className="text-center p-3 font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id} className="border-t border-slate-100">
                    <td className="p-3 text-slate-900">{leave.user?.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        leave.leaveType === "annual" ? "bg-blue-100 text-blue-700" :
                        leave.leaveType === "sick" ? "bg-rose-100 text-rose-700" :
                        leave.leaveType === "emergency" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {leave.leaveType === "annual" ? "سنوية" : leave.leaveType === "sick" ? "مرضية" : leave.leaveType === "emergency" ? "طارئة" : "بدون راتب"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{formatDate(leave.startDate)}</td>
                    <td className="p-3 text-slate-600">{formatDate(leave.endDate)}</td>
                    <td className="p-3 text-center font-medium">{leave.daysCount}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        leave.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        leave.status === "rejected" ? "bg-rose-100 text-rose-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {leave.status === "approved" ? "معتمدة" : leave.status === "rejected" ? "مرفوضة" : "قيد الانتظار"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {leave.status === "pending" && (
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => handleLeaveAction(leave.id, "approved")}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg min-h-[44px]">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleLeaveAction(leave.id, "rejected")}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg min-h-[44px]">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salaries Tab */}
      {activeTab === "salaries" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">المرتبات</h2>
          </div>
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-right p-3 font-medium">الموظف</th>
                  <th className="text-left p-3 font-medium">الأساسي</th>
                  <th className="text-left p-3 font-medium">البدلات</th>
                  <th className="text-left p-3 font-medium">الخصومات</th>
                  <th className="text-left p-3 font-medium">الصافي</th>
                  <th className="text-center p-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((sal) => (
                  <tr key={sal.id} className="border-t border-slate-100">
                    <td className="p-3 text-slate-900">{sal.user?.name}</td>
                    <td className="p-3 text-left">{formatCurrency(sal.basicSalary)}</td>
                    <td className="p-3 text-left">{formatCurrency(sal.allowances)}</td>
                    <td className="p-3 text-left text-rose-600">{formatCurrency(sal.deductions)}</td>
                    <td className="p-3 text-left font-bold">{formatCurrency(sal.netSalary)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sal.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                        sal.status === "approved" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {sal.status === "paid" ? "مدفوع" : sal.status === "approved" ? "معتمد" : "مسودة"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
