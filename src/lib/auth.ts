import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import prisma from "@/lib/prisma";
import type { UserRole } from "@/types";

interface AuthUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) return null;

    // Dev mode session
    if (sessionCookie.startsWith("dev-session-")) {
      const userId = sessionCookie.replace("dev-session-", "");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true, department: true },
      });
      if (!user) return null;
      return {
        uid: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        department: user.department,
      };
    }

    // Firebase session
    if (!adminAuth) return null;

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedClaims.uid },
      select: { id: true, email: true, name: true, role: true, department: true },
    });

    if (!user) return null;

    return {
      uid: decodedClaims.uid,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      department: user.department,
    };
  } catch {
    return null;
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (request: Request) => {
    const user = await getAuthUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "غير مصرح به" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (roles.length > 0 && !roles.includes(user.role)) {
      return new Response(JSON.stringify({ error: "ليس لديك صلاحية" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return null;
  };
}
