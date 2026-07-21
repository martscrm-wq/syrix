import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  try {
    const body = await request.json();
    const lead = await prisma.lead.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ lead });
  } catch { return NextResponse.json({ error: "فشل تحديث العميل المحتمل" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  await prisma.lead.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ message: "تم حذف العميل المحتمل" });
}
