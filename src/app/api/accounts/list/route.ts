import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  }

  try {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        nameAr: true,
        name: true,
        type: true,
        category: true,
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Fetch accounts error:", error);
    return NextResponse.json(
      { error: "فشل جلب الحسابات" },
      { status: 500 }
    );
  }
}
