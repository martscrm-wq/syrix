import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  const unit = await prisma.unit.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!unit) return NextResponse.json({ error: "الوحدة غير موجودة" }, { status: 404 });
  return NextResponse.json({ unit });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  if (!["super_admin", "department_manager"].includes(user.role)) {
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const unit = await prisma.unit.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ unit });
  } catch {
    return NextResponse.json({ error: "فشل تحديث الوحدة" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });
  await prisma.unit.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ message: "تم حذف الوحدة" });
}
