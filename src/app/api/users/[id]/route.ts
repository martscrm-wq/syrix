import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User GET error:", error);
    return NextResponse.json({ error: "فشل جلب المستخدم" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, name, role, department, isActive, devPassword } = body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(role && { role }),
        ...(department && { department }),
        ...(typeof isActive === "boolean" && { isActive }),
        ...(devPassword !== undefined && { devPassword }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User PUT error:", error);
    return NextResponse.json({ error: "فشل تحديث المستخدم" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ message: "تم حذف المستخدم بنجاح" });
  } catch (error) {
    console.error("User DELETE error:", error);
    return NextResponse.json({ error: "فشل حذف المستخدم" }, { status: 500 });
  }
}
