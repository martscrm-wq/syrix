import type { UserRole } from "@/types";

export type PageId =
  | "dashboard"
  | "hr"
  | "operations"
  | "accounts"
  | "marketing"
  | "sales"
  | "users";

export const ROLE_PERMISSIONS: Record<UserRole, PageId[]> = {
  owner: ["dashboard", "hr", "operations", "accounts", "marketing", "sales", "users"],
  super_admin: ["dashboard", "hr", "operations", "accounts", "marketing", "sales", "users"],
  department_manager: ["dashboard", "hr", "operations", "accounts", "marketing", "sales"],
  accountant: ["dashboard", "accounts"],
  employee: ["dashboard", "hr"],
};

export function hasPermission(role: UserRole, page: PageId): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  return allowed ? allowed.includes(page) : false;
}

export function getAllowedPages(role: UserRole): PageId[] {
  return ROLE_PERMISSIONS[role] || ["dashboard"];
}
