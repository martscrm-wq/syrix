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
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { unit: { select: { nameAr: true } } } }),
      prisma.booking.count({ where }),
    ]);
    return NextResponse.json({ bookings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch {
    return NextResponse.json({ error: "فشل جلب الحجوزات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  try {
    const body = await request.json();
    const booking = await prisma.booking.create({ data: body });
    return NextResponse.json({ booking }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "فشل إنشاء الحجز" }, { status: 500 });
  }
}
