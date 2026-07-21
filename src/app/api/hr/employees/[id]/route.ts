import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });

  try {
    const employee = await prisma.employee.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { user: { select: { email: true, role: true } } },
    });

    if (!employee) return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
    if (user.role === "department_manager" && employee.department !== user.department) {
      return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Fetch employee error:", error);
    return NextResponse.json({ error: "فشل جلب بيانات الموظف" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  if (!["super_admin", "department_manager"].includes(user.role)) {
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        fullName: body.fullName,
        fullNameAr: body.fullNameAr,
        position: body.position,
        phone: body.phone,
        basicSalary: body.basicSalary,
        allowances: body.allowances,
        isActive: body.isActive,
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: "فشل تحديث الموظف" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  if (user.role !== "super_admin") {
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });
  }

  try {
    await prisma.employee.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "تم حذف الموظف" });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ error: "فشل حذف الموظف" }, { status: 500 });
  }
}
