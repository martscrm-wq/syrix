import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "تم تسجيل الخروج بنجاح" },
    { status: 200 }
  );

  response.cookies.set("session", "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
