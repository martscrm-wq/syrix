import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  try {
    const body = await request.json();
    const updateData: any = { ...body };

    // Auto-create journal entry when deal becomes "won"
    if (body.stage === "won") {
      const deal = await prisma.deal.findUnique({ where: { id: params.id } });
      if (deal && !deal.wonAt) {
        const salesRev = await prisma.account.findUnique({ where: { code: "SALES_REV" } });
        const bankAcct = await prisma.account.findUnique({ where: { code: "BANK" } });
        if (salesRev && bankAcct) {
          await prisma.$transaction(async (tx) => {
            await tx.journalEntry.create({
              data: {
                entryDate: new Date(),
                description: `إيراد مبيعات - ${body.customerName || deal.customerName}`,
                createdById: user.uid,
                lines: {
                  create: [
                    { accountId: bankAcct.id, debit: body.amount || deal.amount || 0, credit: 0 },
                    { accountId: salesRev.id, debit: 0, credit: body.amount || deal.amount || 0 },
                  ],
                },
              },
            });
          });
        }
      }
      updateData.wonAt = new Date();
    }

    const deal = await prisma.deal.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ deal });
  } catch {
    return NextResponse.json({ error: "فشل تحديث الصفقة" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  await prisma.deal.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ message: "تم حذف الصفقة" });
}
