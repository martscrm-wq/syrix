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

    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: {
        journalLines: {
          where: {
            entry: {
              entryDate: { gte: startDate, lte: endDate },
              deletedAt: null,
            },
          },
        },
      },
    });

    const trialBalance = accounts.map((account) => {
      const totalDebit = account.journalLines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = account.journalLines.reduce((sum, line) => sum + line.credit, 0);

      let balance: number;
      switch (account.type) {
        case "asset":
        case "expense":
          balance = totalDebit - totalCredit;
          break;
        case "liability":
        case "equity":
        case "revenue":
          balance = totalCredit - totalDebit;
          break;
        default:
          balance = totalDebit - totalCredit;
      }

      return {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.nameAr,
        debit: balance > 0 ? balance : 0,
        credit: balance < 0 ? Math.abs(balance) : 0,
        balance,
      };
    });

    const totalDebit = trialBalance.reduce((sum, acct) => sum + acct.debit, 0);
    const totalCredit = trialBalance.reduce((sum, acct) => sum + acct.credit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return NextResponse.json({
      period: { year, month },
      entries: trialBalance.filter((e) => e.debit > 0 || e.credit > 0),
      totals: { debit: totalDebit, credit: totalCredit },
      isBalanced,
    });
  } catch (error) {
    console.error("Trial balance error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء ميزان المراجعة" },
      { status: 500 }
    );
  }
}
