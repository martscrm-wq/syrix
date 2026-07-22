import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAllowedPages } from "@/lib/permissions";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  }

  const permissions = getAllowedPages(user.role);

  return NextResponse.json({ user: { ...user, permissions } }, { status: 200 });
}
