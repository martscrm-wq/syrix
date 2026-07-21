import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 50);
  const skip = (page - 1) * limit;
  const stage = searchParams.get("stage");
  const where: any = { deletedAt: null };
  if (stage) where.stage = stage;
  try {
    const [deals, total] = await Promise.all([
      prisma.deal.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.deal.count({ where }),
    ]);
    return NextResponse.json({ deals, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch { return NextResponse.json({ error: "فشل جلب الصفقات" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  try {
    const body = await request.json();
    let deal = await prisma.deal.create({ data: { ...body, assignedTo: user.uid } });

    // If stage is "won", create journal entry (Dr. Bank/AR / Cr. Sales Revenue)
    if (body.stage === "won") {
      const salesRev = await prisma.account.findUnique({ where: { code: "SALES_REV" } });
      const bankAcct = await prisma.account.findUnique({ where: { code: "BANK" } });
      if (salesRev && bankAcct) {
        await prisma.$transaction(async (tx) => {
          const entry = await tx.journalEntry.create({
            data: {
              entryDate: new Date(),
              description: `إيراد مبيعات - ${body.customerName}`,
              createdById: user.uid,
              lines: {
                create: [
                  { accountId: bankAcct.id, debit: body.amount || 0, credit: 0 },
                  { accountId: salesRev.id, debit: 0, credit: body.amount || 0 },
                ],
              },
            },
          });
          await tx.deal.update({ where: { id: deal.id }, data: { wonAt: new Date() } });
        });
      }
    }

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error("Create deal error:", error);
    return NextResponse.json({ error: "فشل إنشاء الصفقة" }, { status: 500 });
  }
}
