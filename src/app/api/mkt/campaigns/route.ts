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
  try {
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({ where: { deletedAt: null }, skip, take: limit, orderBy: { createdAt: "desc" }, include: { _count: { select: { leads: true } } } }),
      prisma.campaign.count({ where: { deletedAt: null } }),
    ]);
    return NextResponse.json({ campaigns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch { return NextResponse.json({ error: "فشل جلب الحملات" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  try {
    const body = await request.json();
    const campaign = await prisma.campaign.create({ data: body });
    return NextResponse.json({ campaign }, { status: 201 });
  } catch { return NextResponse.json({ error: "فشل إنشاء الحملة" }, { status: 500 }); }
}
