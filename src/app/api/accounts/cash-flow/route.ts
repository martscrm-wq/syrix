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
    const priorEndDate = new Date(year, month - 1, 0, 23, 59, 59);

    const cashAccounts = await prisma.account.findMany({
      where: { code: { in: ["CASH", "BANK"] }, isActive: true },
      include: {
        journalLines: { include: { entry: true } },
      },
    });

    if (cashAccounts.length === 0) {
      return NextResponse.json({ error: "حسابات النقدية غير موجودة" }, { status: 404 });
    }

    const allAccounts = await prisma.account.findMany({
      where: { isActive: true },
      include: {
        journalLines: { include: { entry: true } },
      },
    });

    const getCashFlow = (code: string, period: boolean) => {
      const acct = cashAccounts.find((a) => a.code === code);
      if (!acct) return { period: 0, all: 0, prior: 0 };
      const lines = acct.journalLines.filter((l) => !l.entry.deletedAt);
      const periodLines = lines.filter(
        (l) => l.entry.entryDate >= startDate && l.entry.entryDate <= endDate
      );
      const allUpToEnd = lines.filter((l) => l.entry.entryDate <= endDate);
      const allUpToPrior = lines.filter((l) => l.entry.entryDate <= priorEndDate);
      const calcSum = (ls: typeof lines) => ls.reduce((s, l) => s + l.debit - l.credit, 0);
      return { period: calcSum(periodLines), all: calcSum(allUpToEnd), prior: calcSum(allUpToPrior) };
    };

    const cashFlow = getCashFlow("CASH", true);
    const bankFlow = getCashFlow("BANK", true);

    // Classify cash movements by counterparty account type
    const classifyFlow = () => {
      const flow = { operating: 0, investing: 0, financing: 0 };

      for (const acct of cashAccounts) {
        const lines = acct.journalLines.filter(
          (l) => l.entry.entryDate >= startDate && l.entry.entryDate <= endDate && !l.entry.deletedAt
        );

        for (const line of lines) {
          const counterparty = allAccounts.find((a) =>
            a.journalLines.some(
              (jl) => jl.entryId === line.entryId && jl.accountId !== acct.id
            )
          );
          if (!counterparty) { flow.operating += line.debit - line.credit; continue; }

          if (counterparty.type === "asset" &&
              (counterparty.category === "fixed_asset" || counterparty.category === "intangible_asset")) {
            flow.investing += line.debit - line.credit;
          } else if (counterparty.type === "liability" ||
                     counterparty.category === "equity") {
            flow.financing += line.debit - line.credit;
          } else {
            flow.operating += line.debit - line.credit;
          }
        }
      }
      return flow;
    };

    const classified = classifyFlow();
    const totalChange = cashFlow.period + bankFlow.period;
    const endingCash = cashFlow.all + bankFlow.all;
    const beginningCash = cashFlow.prior + bankFlow.prior;

    return NextResponse.json({
      period: { year, month },
      operatingActivities: Math.round(classified.operating * 100) / 100,
      investingActivities: Math.round(classified.investing * 100) / 100,
      financingActivities: Math.round(classified.financing * 100) / 100,
      netChange: Math.round(totalChange * 100) / 100,
      beginningCash: Math.round(beginningCash * 100) / 100,
      endingCash: Math.round(endingCash * 100) / 100,
    });
  } catch (error) {
    console.error("Cash flow error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء قائمة التدفقات النقدية" },
      { status: 500 }
    );
  }
}
