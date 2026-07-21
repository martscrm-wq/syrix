import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });

  try {
    const body = await request.json();

    if (body.startDate >= body.endDate) {
      return NextResponse.json({ error: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" }, { status: 400 });
    }

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    // Check annual leave balance
    if (body.leaveType === "annual") {
      const usedDays = await prisma.leave.aggregate({
        where: { userId: user.uid, leaveType: "annual", status: "approved", deletedAt: null },
        _sum: { daysCount: true },
      });

      const totalAnnualLeave = 21; // default 21 days/year
      const remaining = totalAnnualLeave - (usedDays._sum.daysCount || 0);
      if (daysCount > remaining) {
        return NextResponse.json({
          error: `رصيد الإجازات المتبقي غير كافٍ. المتبقي: ${remaining} يوم`,
          remaining,
        }, { status: 400 });
      }
    }

    const leave = await prisma.leave.create({
      data: {
        userId: user.uid,
        leaveType: body.leaveType,
        startDate: start,
        endDate: end,
        daysCount,
        reason: body.reason,
      },
    });

    return NextResponse.json({ leave }, { status: 201 });
  } catch (error) {
    console.error("Create leave error:", error);
    return NextResponse.json({ error: "فشل إنشاء طلب الإجازة" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 50);
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (user.role === "employee") where.userId = user.uid;

  try {
    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      }),
      prisma.leave.count({ where }),
    ]);

    return NextResponse.json({
      leaves,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Fetch leaves error:", error);
    return NextResponse.json({ error: "فشل جلب طلبات الإجازات" }, { status: 500 });
  }
}
