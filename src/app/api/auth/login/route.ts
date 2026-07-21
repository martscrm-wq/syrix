import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { loginRateLimit } from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { success } = await loginRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "محاولات كثيرة جدًا. حاول بعد دقيقة" },
        { status: 429 }
      );
    }

    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json(
        { error: "معرف التوكن مطلوب" },
        { status: 400 }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json(
      { message: "تم تسجيل الدخول بنجاح" },
      { status: 200 }
    );

    response.cookies.set("session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "فشل تسجيل الدخول" },
      { status: 401 }
    );
  }
}
