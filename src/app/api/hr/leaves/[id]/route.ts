import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  if (!["super_admin", "department_manager"].includes(user.role)) {
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const leave = await prisma.leave.update({
      where: { id: params.id },
      data: {
        status: body.status,
        approvedBy: user.uid,
        approvedAt: body.status === "approved" ? new Date() : undefined,
      },
    });

    return NextResponse.json({ leave });
  } catch (error) {
    console.error("Update leave error:", error);
    return NextResponse.json({ error: "فشل تحديث طلب الإجازة" }, { status: 500 });
  }
}
