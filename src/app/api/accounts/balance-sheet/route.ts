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

    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: {
        journalLines: {
          where: {
            entry: { entryDate: { lte: endDate }, deletedAt: null },
          },
        },
      },
    });

    const calculateBalance = (acct: typeof accounts[0]) => {
      const debit = acct.journalLines.reduce((s, l) => s + l.debit, 0);
      const credit = acct.journalLines.reduce((s, l) => s + l.credit, 0);
      if (acct.type === "asset" || acct.type === "expense") return debit - credit;
      return credit - debit;
    };

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    accounts.forEach((acct) => {
      const balance = calculateBalance(acct);
      switch (acct.category) {
        case "current_asset":
        case "fixed_asset":
        case "intangible_asset":
        case "contra_asset":
          totalAssets += balance;
          break;
        case "current_liability":
        case "long_term_liability":
          totalLiabilities += balance;
          break;
        case "equity":
          totalEquity += balance;
          break;
      }
    });

    const accountingEquation = Math.abs(totalAssets - (totalLiabilities + totalEquity));

    return NextResponse.json({
      date: endDate.toISOString(),
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: accountingEquation < 0.01,
      difference: accountingEquation,
    });
  } catch (error) {
    console.error("Balance sheet error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء الميزانية العمومية" },
      { status: 500 }
    );
  }
}
