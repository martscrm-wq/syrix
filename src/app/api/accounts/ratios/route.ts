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
        journalLines: { include: { entry: true } },
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

    const getNetBalanceByCode = (code: string) => {
      const account = accounts.find((a) => a.code === code);
      if (!account) return 0;
      const lines = account.journalLines.filter(
        (l) => l.entry.entryDate <= endDate && !l.entry.deletedAt
      );
      const debit = lines.reduce((s, l) => s + l.debit, 0);
      const credit = lines.reduce((s, l) => s + l.credit, 0);
      return account.type === "asset" || account.type === "expense" ? debit - credit : credit - debit;
    };

    const currentAssets = getBalances("current_asset");
    const fixedAssets = getBalances("fixed_asset");
    const intangibleAssets = getBalances("intangible_asset");
    const contraAssets = getBalances("contra_asset");
    const currentLiabilities = getBalances("current_liability");
    const longTermLiabilities = getBalances("long_term_liability");
    const totalAssets = currentAssets + fixedAssets + intangibleAssets - contraAssets;
    const totalLiabilities = currentLiabilities + longTermLiabilities;
    const totalEquity = getBalances("equity");
    const revenue = getPeriodSum("revenue");
    const expenses = getPeriodSum("expense");
    const netIncome = revenue - expenses;
    const cashBalance = getNetBalanceByCode("CASH") + getNetBalanceByCode("BANK");
    const inventoryBalance = getNetBalanceByCode("INV");
    const arBalance = getNetBalanceByCode("AR");
    const interestExpense = accounts
      .filter((a) => a.code === "INTEREST_EXP")
      .map((a) => {
        const lines = a.journalLines.filter(
          (l) => l.entry.entryDate >= startDate && l.entry.entryDate <= endDate && !l.entry.deletedAt
        );
        return lines.reduce((s, l) => s + l.debit, 0) - lines.reduce((s, l) => s + l.credit, 0);
      })
      .reduce((s, b) => s + b, 0);

    const periodSalesRevenue = accounts
      .filter((a) => a.code === "SALES_REV" || a.code === "SERVICE_REV")
      .map((a) => {
        const lines = a.journalLines.filter(
          (l) => l.entry.entryDate >= startDate && l.entry.entryDate <= endDate && !l.entry.deletedAt
        );
        return lines.reduce((s, l) => s + l.credit, 0) - lines.reduce((s, l) => s + l.debit, 0);
      })
      .reduce((s, b) => s + b, 0);

    const avgInventory = inventoryBalance;
    const avgAR = arBalance;

    const ratios = {
      liquidity: {
        currentRatio: currentLiabilities > 0
          ? Math.round((currentAssets / currentLiabilities) * 100) / 100
          : 0,
        quickRatio: currentLiabilities > 0
          ? Math.round(((currentAssets - inventoryBalance) / currentLiabilities) * 100) / 100
          : 0,
        cashRatio: currentLiabilities > 0
          ? Math.round((cashBalance / currentLiabilities) * 100) / 100
          : 0,
      },
      profitability: {
        grossProfitMargin: revenue > 0
          ? Math.round(((revenue - expenses) / revenue) * 10000) / 100
          : 0,
        netProfitMargin: revenue > 0
          ? Math.round((netIncome / revenue) * 10000) / 100
          : 0,
        returnOnAssets: totalAssets > 0
          ? Math.round((netIncome / totalAssets) * 10000) / 100
          : 0,
        returnOnEquity: totalEquity > 0
          ? Math.round((netIncome / totalEquity) * 10000) / 100
          : 0,
      },
      solvency: {
        debtToAssets: totalAssets > 0
          ? Math.round((totalLiabilities / totalAssets) * 10000) / 100
          : 0,
        debtToEquity: totalEquity > 0
          ? Math.round((totalLiabilities / totalEquity) * 10000) / 100
          : 0,
        timesInterestEarned: interestExpense > 0
          ? Math.round((netIncome / interestExpense) * 100) / 100
          : 0,
      },
      activity: {
        inventoryTurnover: avgInventory > 0
          ? Math.round((expenses / avgInventory) * 100) / 100
          : 0,
        accountsReceivableTurnover: avgAR > 0
          ? Math.round((periodSalesRevenue / avgAR) * 100) / 100
          : 0,
        totalAssetTurnover: revenue > 0 && totalAssets > 0
          ? Math.round((revenue / totalAssets) * 100) / 100
          : 0,
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
