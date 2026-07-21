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

    // Cash account
    const cashAccount = await prisma.account.findFirst({
      where: { code: "CASH", isActive: true },
      include: {
        journalLines: {
          include: { entry: true },
        },
      },
    });

    if (!cashAccount) {
      return NextResponse.json({ error: "حساب النقدية غير موجود" }, { status: 404 });
    }

    const periodLines = cashAccount.journalLines.filter(
      (l) => l.entry.entryDate >= startDate && l.entry.entryDate <= endDate && !l.entry.deletedAt
    );

    const allLines = cashAccount.journalLines.filter(
      (l) => !l.entry.deletedAt
    );

    const calcSum = (lines: typeof periodLines) =>
      lines.reduce((s, l) => s + l.debit - l.credit, 0);

    const operatingChange = calcSum(periodLines);
    const endingCash = calcSum(allLines.filter((l) => l.entry.entryDate <= endDate));
    const beginningCash = calcSum(allLines.filter((l) => l.entry.entryDate <= priorEndDate));

    return NextResponse.json({
      period: { year, month },
      operatingActivities: operatingChange,
      investingActivities: 0,
      financingActivities: 0,
      netChange: operatingChange,
      beginningCash,
      endingCash,
    });
  } catch (error) {
    console.error("Cash flow error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء قائمة التدفقات النقدية" },
      { status: 500 }
    );
  }
}
