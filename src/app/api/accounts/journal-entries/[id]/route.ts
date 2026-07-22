import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: { include: { account: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });
    if (!entry) {
      return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Fetch journal entry error:", error);
    return NextResponse.json({ error: "فشل جلب القيد" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const body = await request.json();
    const { entryDate, description, reference, category, lines } = body;

    if (!entryDate || !description || !lines || lines.length < 2) {
      return NextResponse.json({ error: "تاريخ القيد والوصف وبندان على الأقل مطلوبون" }, { status: 400 });
    }

    const validCategories = ["opening", "operating", "adjusting", "closing", "reversing", "advanced"];
    const entryCategory = validCategories.includes(category) ? category : "operating";

    const totalDebit = lines.reduce((sum: number, l: { debit: number }) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, l: { credit: number }) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return NextResponse.json({ error: "القيد غير متوازن" }, { status: 400 });
    }

    const existing = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
    }

    const entry = await prisma.$transaction(async (tx) => {
      await tx.journalLine.deleteMany({ where: { entryId: id } });
      return tx.journalEntry.update({
        where: { id },
        data: {
          entryDate: new Date(entryDate),
          description,
          reference,
          category: entryCategory,
          lines: {
            create: lines.map((line: { accountId: string; debit?: number; credit?: number; description?: string }) => ({
              accountId: line.accountId,
              debit: line.debit || 0,
              credit: line.credit || 0,
              description: line.description || null,
            })),
          },
        },
        include: { lines: { include: { account: true } } },
      });
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Update journal entry error:", error);
    return NextResponse.json({ error: "فشل تحديث القيد" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const existing = await prisma.journalEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "القيد غير موجود" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.journalLine.deleteMany({ where: { entryId: id } });
      await tx.journalEntry.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete journal entry error:", error);
    return NextResponse.json({ error: "فشل حذف القيد" }, { status: 500 });
  }
}
