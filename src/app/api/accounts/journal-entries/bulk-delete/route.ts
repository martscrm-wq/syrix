import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  }

  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "يجب تحديد قيود للحذف" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        await tx.journalLine.deleteMany({ where: { entryId: id } });
        await tx.journalEntry.delete({ where: { id } });
      }
    });

    return NextResponse.json({ message: `تم حذف ${ids.length} قيد بنجاح` });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "فشل الحذف المجمع" }, { status: 500 });
  }
}
