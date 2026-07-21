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
  const status = searchParams.get("status");

  const where: any = { deletedAt: null };
  if (status) where.status = status;

  try {
    const [units, total] = await Promise.all([
      prisma.unit.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.unit.count({ where }),
    ]);
    return NextResponse.json({ units, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Fetch units error:", error);
    return NextResponse.json({ error: "فشل جلب الوحدات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  if (!["super_admin", "department_manager"].includes(user.role) || (user.role === "department_manager" && user.department !== "operations")) {
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const unit = await prisma.unit.create({ data: body });
    return NextResponse.json({ unit }, { status: 201 });
  } catch (error) {
    console.error("Create unit error:", error);
    return NextResponse.json({ error: "فشل إنشاء الوحدة" }, { status: 500 });
  }
}
