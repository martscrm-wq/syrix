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
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { campaign: { select: { name: true } } } }),
      prisma.lead.count({ where }),
    ]);
    return NextResponse.json({ leads, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch { return NextResponse.json({ error: "فشل جلب العملاء المحتملين" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.source) return NextResponse.json({ error: "مصدر العميل المحتمل مطلوب" }, { status: 400 });
    const lead = await prisma.lead.create({ data: body });
    return NextResponse.json({ lead }, { status: 201 });
  } catch { return NextResponse.json({ error: "فشل إنشاء العميل المحتمل" }, { status: 500 }); }
}
