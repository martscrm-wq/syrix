import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.devPassword !== password) {
      return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    if (!user.isActive || user.deletedAt) {
      return NextResponse.json({ error: "الحساب غير نشط" }, { status: 403 });
    }

    const response = NextResponse.json({
      message: "تم تسجيل الدخول بنجاح",
      user: { name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set("session", `dev-session-${user.id}`, {
      maxAge: 60 * 60 * 24 * 5,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Local login error:", error);
    return NextResponse.json({ error: "فشل تسجيل الدخول" }, { status: 500 });
  }
}
