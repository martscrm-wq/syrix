import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
          deletedAt: null,
        }
      : { deletedAt: null };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total });
  } catch (error) {
    console.error("Users GET error:", error);
    return NextResponse.json({ error: "فشل جلب المستخدمين" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, department, devPassword } = body;

    if (!email || !name) {
      return NextResponse.json({ error: "البريد الإلكتروني والاسم مطلوبان" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        firebaseUid: `dev-${Date.now()}`,
        email,
        name,
        role: role || "employee",
        department: department || "hr",
        devPassword: devPassword || "123456",
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

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Users POST error:", error);
    return NextResponse.json({ error: "فشل إنشاء المستخدم" }, { status: 500 });
  }
}
