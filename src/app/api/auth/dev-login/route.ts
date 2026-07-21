import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    // Auto-create dev user if not exists
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: `dev-${Date.now()}`,
          email,
          name: "مدير النظام",
          role: "super_admin",
          department: "accounts",
        },
      });
    }

    // Create a simple dev session cookie
    const response = NextResponse.json({ message: "تم تسجيل الدخول (وضع التطوير)" });

    response.cookies.set("session", `dev-session-${user.id}`, {
      maxAge: 60 * 60 * 24 * 5, // 5 days
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Dev login error:", error);
    return NextResponse.json({ error: "فشل تسجيل الدخول التجريبي" }, { status: 500 });
  }
}
