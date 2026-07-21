import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });

  try {
    const body = await request.json();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        userId: user.uid,
        date: { gte: today, lt: new Date(today.getTime() + 86400000) },
      },
    });

    if (body.action === "checkin") {
      if (existing?.checkIn) {
        return NextResponse.json({ error: "تم تسجيل الحضور مسبقًا اليوم" }, { status: 400 });
      }
      const attendance = await prisma.attendance.create({
        data: { userId: user.uid, checkIn: new Date(), status: "present" },
      });
      return NextResponse.json({ attendance, message: "تم تسجيل الحضور" }, { status: 201 });
    }

    if (body.action === "checkout") {
      if (!existing) {
        return NextResponse.json({ error: "لم يتم تسجيل الحضور اليوم" }, { status: 400 });
      }
      if (existing.checkOut) {
        return NextResponse.json({ error: "تم تسجيل الانصراف مسبقًا" }, { status: 400 });
      }
      const attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: { checkOut: new Date() },
      });
      return NextResponse.json({ attendance, message: "تم تسجيل الانصراف" });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Attendance error:", error);
    return NextResponse.json({ error: "فشل تسجيل الحضور" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 50);
  const skip = (page - 1) * limit;
  const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const where: any = {
    date: { gte: startDate, lte: endDate },
  };

  if (user.role === "employee") where.userId = user.uid;

  try {
    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: { user: { select: { name: true } } },
      }),
      prisma.attendance.count({ where }),
    ]);

    return NextResponse.json({
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Fetch attendance error:", error);
    return NextResponse.json({ error: "فشل جلب سجل الحضور" }, { status: 500 });
  }
}
