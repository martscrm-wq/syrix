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

    const endDate = new Date(year, month, 0, 23, 59, 59);
    const startDate = new Date(year, month - 1, 1);

    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: {
        journalLines: {
          include: { entry: true },
        },
      },
    });

    const getBalances = (category: string) => {
      return accounts
        .filter((a) => a.category === category)
        .map((a) => {
          const lines = a.journalLines.filter(
            (l) => l.entry.entryDate <= endDate && !l.entry.deletedAt
          );
          const debit = lines.reduce((s, l) => s + l.debit, 0);
          const credit = lines.reduce((s, l) => s + l.credit, 0);
          return a.type === "asset" || a.type === "expense" ? debit - credit : credit - debit;
        })
        .reduce((s, b) => s + b, 0);
    };

    const getPeriodSum = (category: string) => {
      return accounts
        .filter((a) => a.category === category)
        .map((a) => {
          const lines = a.journalLines.filter(
            (l) =>
              l.entry.entryDate >= startDate &&
              l.entry.entryDate <= endDate &&
              !l.entry.deletedAt
          );
          const debit = lines.reduce((s, l) => s + l.debit, 0);
          const credit = lines.reduce((s, l) => s + l.credit, 0);
          return a.type === "revenue"
            ? credit - debit
            : a.type === "expense"
              ? debit - credit
              : 0;
        })
        .reduce((s, b) => s + b, 0);
    };

    const currentAssets = getBalances("current_asset");
    const currentLiabilities = getBalances("current_liability");
    const totalAssets = currentAssets + getBalances("fixed_asset");
    const totalLiabilities = currentLiabilities + getBalances("long_term_liability");
    const totalEquity = getBalances("equity");
    const revenue = getPeriodSum("revenue");
    const expenses = getPeriodSum("expense");
    const netIncome = revenue - expenses;
    const cash = getBalances("current_asset");

    const ratios = {
      liquidity: {
        currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
        quickRatio: currentLiabilities > 0 ? (currentAssets - getBalances("inventory")) / currentLiabilities : 0,
        cashRatio: currentLiabilities > 0 ? cash / currentLiabilities : 0,
      },
      profitability: {
        grossProfitMargin: revenue > 0 ? (revenue - getBalances("expense")) / revenue : 0,
        netProfitMargin: revenue > 0 ? netIncome / revenue : 0,
        returnOnAssets: totalAssets > 0 ? netIncome / totalAssets : 0,
        returnOnEquity: totalEquity > 0 ? netIncome / totalEquity : 0,
      },
      solvency: {
        debtToAssets: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
        debtToEquity: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
        timesInterestEarned: 0,
      },
      activity: {
        inventoryTurnover: 0,
        accountsReceivableTurnover: 0,
        totalAssetTurnover: revenue > 0 && totalAssets > 0 ? revenue / totalAssets : 0,
      },
    };

    return NextResponse.json({ ratios, period: { year, month } });
  } catch (error) {
    console.error("Ratios error:", error);
    return NextResponse.json(
      { error: "فشل حساب النسب المالية" },
      { status: 500 }
    );
  }
}
