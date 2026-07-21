import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const revenueAccounts = await prisma.account.findMany({
      where: { type: "revenue", isActive: true },
      include: {
        journalLines: {
          where: {
            entry: { entryDate: { gte: startDate, lte: endDate }, deletedAt: null },
          },
        },
      },
    });

    const expenseAccounts = await prisma.account.findMany({
      where: { type: "expense", isActive: true },
      include: {
        journalLines: {
          where: {
            entry: { entryDate: { gte: startDate, lte: endDate }, deletedAt: null },
          },
        },
      },
    });

    const calcRevenue = (accounts: typeof revenueAccounts) =>
      accounts.reduce((sum, acct) => {
        const credit = acct.journalLines.reduce((s, l) => s + l.credit, 0);
        const debit = acct.journalLines.reduce((s, l) => s + l.debit, 0);
        return sum + (credit - debit); // Revenue: credit increases, debit decreases
      }, 0);

    const calcExpenses = (accounts: typeof expenseAccounts) =>
      accounts.reduce((sum, acct) => {
        const debit = acct.journalLines.reduce((s, l) => s + l.debit, 0);
        const credit = acct.journalLines.reduce((s, l) => s + l.credit, 0);
        return sum + (debit - credit); // Expenses: debit increases, credit decreases
      }, 0);

    const totalRevenue = calcRevenue(revenueAccounts);
    const totalExpenses = calcExpenses(expenseAccounts);

    const incomeStatement = {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      period: { year, month },
    };

    return NextResponse.json(incomeStatement);
  } catch (error) {
    console.error("Income statement error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء قائمة الدخل" },
      { status: 500 }
    );
  }
}
