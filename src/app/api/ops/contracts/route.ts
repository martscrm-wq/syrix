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
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { endDate: "asc" },
        include: { unit: { select: { nameAr: true } } },
      }),
      prisma.contract.count({ where }),
    ]);
    return NextResponse.json({ contracts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch {
    return NextResponse.json({ error: "فشل جلب التعاقدات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  try {
    const body = await request.json();
    const contract = await prisma.contract.create({ data: body });

    // Check if contract ends within 30 days for notification flag
    const endDate = new Date(contract.endDate);
    const now = new Date();
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (daysUntilEnd <= 30 && daysUntilEnd >= 0) {
      await prisma.contract.update({ where: { id: contract.id }, data: { notifiedBefore30d: true } });
    }

    return NextResponse.json({ contract }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "فشل إنشاء التعاقد" }, { status: 500 });
  }
}
