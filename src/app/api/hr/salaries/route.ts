import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  if (!["super_admin", "department_manager", "accountant"].includes(user.role)) {
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const netSalary = (body.basicSalary || 0) + (body.allowances || 0) + (body.bonus || 0) + (body.overtime || 0) - (body.deductions || 0);

    // If status is "paid", create a journal entry
    let journalEntryId: string | undefined;
    if (body.status === "paid") {
      const salariesExpense = await prisma.account.findUnique({ where: { code: "SALARIES_EXP" } });
      const bankAccount = await prisma.account.findUnique({ where: { code: "BANK" } });

      if (!salariesExpense || !bankAccount) {
        return NextResponse.json({ error: "حسابات المرتبات أو البنك غير موجودة" }, { status: 400 });
      }

      const entry = await prisma.$transaction(async (tx) => {
        return tx.journalEntry.create({
          data: {
            entryDate: new Date(),
            description: `صرف مرتب ${body.userId} - ${body.month}/${body.year}`,
            createdById: user.uid,
            lines: {
              create: [
                { accountId: salariesExpense.id, debit: netSalary, credit: 0 },
                { accountId: bankAccount.id, debit: 0, credit: netSalary },
              ],
            },
          },
        });
      });

      journalEntryId = entry.id;
    }

    const salary = await prisma.salary.create({
      data: {
        userId: body.userId,
        month: body.month,
        year: body.year,
        basicSalary: body.basicSalary || 0,
        allowances: body.allowances || 0,
        deductions: body.deductions || 0,
        netSalary,
        bonus: body.bonus || 0,
        overtime: body.overtime || 0,
        status: body.status || "draft",
        paidAt: body.status === "paid" ? new Date() : undefined,
        journalEntryId,
      },
    });

    return NextResponse.json({ salary }, { status: 201 });
  } catch (error) {
    console.error("Create salary error:", error);
    return NextResponse.json({ error: "فشل إنشاء المرتب" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 50);
  const skip = (page - 1) * limit;
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

  const where: any = { month, year, deletedAt: null };
  if (user.role === "employee") where.userId = user.uid;

  try {
    const [salaries, total] = await Promise.all([
      prisma.salary.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      }),
      prisma.salary.count({ where }),
    ]);

    return NextResponse.json({
      salaries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Fetch salaries error:", error);
    return NextResponse.json({ error: "فشل جلب المرتبات" }, { status: 500 });
  }
}
