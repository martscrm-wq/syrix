import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  if (user.role === "employee") return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 50);
  const skip = (page - 1) * limit;
  const department = searchParams.get("department");

  const where: any = { deletedAt: null };
  if (department) where.department = department;
  if (user.role === "department_manager") where.department = user.department;

  try {
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true } } },
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      employees,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Fetch employees error:", error);
    return NextResponse.json({ error: "فشل جلب الموظفين" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  if (!["super_admin", "department_manager"].includes(user.role)) {
    return NextResponse.json({ error: "ليس لديك صلاحية" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const employee = await prisma.employee.create({
      data: {
        userId: body.userId,
        employeeCode: body.employeeCode,
        fullName: body.fullName,
        fullNameAr: body.fullNameAr,
        position: body.position,
        department: body.department,
        phone: body.phone,
        hireDate: new Date(body.hireDate),
        basicSalary: body.basicSalary || 0,
        allowances: body.allowances || 0,
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: "فشل إنشاء الموظف" }, { status: 500 });
  }
}
