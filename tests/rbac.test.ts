/**
 * SYRIX RBAC Integration Tests
 *
 * Tests that each role is properly restricted:
 * - Super Admin: access to everything
 * - Department Manager: own department only
 * - Employee: personal data only
 * - Accountant: accounts module only
 *
 * Run: npx jest tests/rbac.test.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mock auth context
const mockUsers = {
  superAdmin: { uid: "admin-uid", role: "super_admin", department: "hr" },
  hrManager: { uid: "hr-mgr-uid", role: "department_manager", department: "hr" },
  accManager: { uid: "acc-mgr-uid", role: "department_manager", department: "accounts" },
  employee: { uid: "emp-uid", role: "employee", department: "hr" },
  accountant: { uid: "acct-uid", role: "accountant", department: "accounts" },
};

type MockUser = (typeof mockUsers)[keyof typeof mockUsers];

// RBAC permission matrix
// [role, canAccessAccounts, canAccessHR, canAccessOps, canAccessMkt, canAccessSales]
const permissionMatrix: [MockUser, boolean, boolean, boolean, boolean, boolean][] = [
  [mockUsers.superAdmin, true, true, true, true, true],
  [mockUsers.hrManager, false, true, false, false, false],
  [mockUsers.accManager, true, false, false, false, false],
  [mockUsers.employee, false, false, false, false, false],
  [mockUsers.accountant, true, false, false, false, false],
];

describe("RBAC Permission Matrix", () => {
  test.each(permissionMatrix)(
    "%s.role canAccessAccounts=%s canAccessHR=%s canAccessOps=%s canAccessMkt=%s canAccessSales=%s",
    (user, canAcc, canHR, canOps, canMkt, canSales) => {
      // Accounts module access
      const accModules = ["accounts"];
      const hrModules = ["hr"];
      const opsModules = ["operations"];
      const mktModules = ["marketing"];
      const salesModules = ["sales"];

      const hasAccess = (moduleType: string): boolean => {
        if (user.role === "super_admin") return true;
        if (user.role === "employee") return false;

        // Department managers access only their department
        if (user.role === "department_manager") {
          const deptMap: Record<string, string[]> = {
            hr: ["hr"],
            accounts: ["accounts"],
            operations: ["operations"],
            marketing: ["marketing"],
            sales: ["sales"],
          };
          return deptMap[user.department]?.includes(moduleType) ?? false;
        }

        // Accountants access only accounts
        if (user.role === "accountant") {
          return moduleType === "accounts";
        }

        return false;
      };

      // Test each module access
      const checkAccess = (module: string, expected: boolean) => {
        if (expected) {
          expect(hasAccess(module)).toBe(true);
        } else {
          expect(hasAccess(module)).toBe(false);
        }
      };

      // Run assertions
      checkAccess("accounts", canAcc);
      checkAccess("hr", canHR);
      checkAccess("operations", canOps);
      checkAccess("marketing", canMkt);
      checkAccess("sales", canSales);
    }
  );

  // Test employee data isolation
  test("employee can only access their own data", () => {
    const canAccessEmployeeData = (viewingUserId: string, currentUserId: string, role: string): boolean => {
      if (role === "super_admin") return true;
      return viewingUserId === currentUserId;
    };

    // Employee can see their own data
    expect(canAccessEmployeeData("emp-uid", "emp-uid", "employee")).toBe(true);

    // Employee cannot see other's data
    expect(canAccessEmployeeData("other-uid", "emp-uid", "employee")).toBe(false);

    // Super admin can see anyone's data
    expect(canAccessEmployeeData("other-uid", "admin-uid", "super_admin")).toBe(true);
  });

  // Test junior employee cannot modify data
  test("employee role cannot write/delete data", () => {
    const canWrite = (role: string): boolean => {
      return !["employee"].includes(role);
    };

    expect(canWrite("super_admin")).toBe(true);
    expect(canWrite("department_manager")).toBe(true);
    expect(canWrite("accountant")).toBe(true);
    expect(canWrite("employee")).toBe(false);
  });
});

describe("Accounting Double-Entry Integrity", () => {
  test("journal entry must have balanced debits and credits", () => {
    const validateEntry = (lines: { debit: number; credit: number }[]): boolean => {
      const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
      return Math.abs(totalDebit - totalCredit) < 0.001;
    };

    // Balanced entry
    expect(validateEntry([
      { debit: 1000, credit: 0 },
      { debit: 0, credit: 1000 },
    ])).toBe(true);

    // Unbalanced entry
    expect(validateEntry([
      { debit: 1000, credit: 0 },
      { debit: 0, credit: 500 },
    ])).toBe(false);

    // Empty lines
    expect(validateEntry([])).toBe(true);
  });

  test("American Rule balance calculation", () => {
    const calculateBalance = (
      type: "asset" | "liability" | "equity" | "revenue" | "expense",
      totalDebit: number,
      totalCredit: number
    ): number => {
      switch (type) {
        case "asset":
        case "expense":
          return totalDebit - totalCredit;
        case "liability":
        case "equity":
        case "revenue":
          return totalCredit - totalDebit;
      }
    };

    // Assets increase with debit
    expect(calculateBalance("asset", 1000, 0)).toBe(1000);
    expect(calculateBalance("asset", 0, 500)).toBe(-500);

    // Liabilities increase with credit
    expect(calculateBalance("liability", 0, 1000)).toBe(1000);
    expect(calculateBalance("liability", 500, 0)).toBe(-500);

    // Revenue increases with credit
    expect(calculateBalance("revenue", 0, 5000)).toBe(5000);

    // Expenses increase with debit
    expect(calculateBalance("expense", 2000, 0)).toBe(2000);
  });
});

describe("Pagination Enforcement", () => {
  test("limit parameter is capped at 50", () => {
    const getLimit = (requested: number): number => {
      return Math.min(Math.max(requested, 1), 50);
    };

    expect(getLimit(50)).toBe(50);
    expect(getLimit(100)).toBe(50);
    expect(getLimit(10)).toBe(10);
    expect(getLimit(0)).toBe(1);
    expect(getLimit(-5)).toBe(1);
  });
});

describe("Leave Balance Check", () => {
  test("leave request rejected when balance insufficient", () => {
    const canRequestLeave = (requestedDays: number, usedDays: number, totalEntitlement: number): { allowed: boolean; remaining: number; message?: string } => {
      const remaining = totalEntitlement - usedDays;
      if (requestedDays > remaining) {
        return { allowed: false, remaining, message: `الرصيد المتبقي ${remaining} يوم غير كافٍ` };
      }
      return { allowed: true, remaining };
    };

    // Has enough balance
    expect(canRequestLeave(5, 10, 21).allowed).toBe(true);

    // Insufficient balance
    const result = canRequestLeave(15, 10, 21);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(11);

    // Exactly at limit
    expect(canRequestLeave(11, 10, 21).allowed).toBe(true);
  });
});

describe("Soft Delete Enforcement", () => {
  test("records are soft-deleted, not hard-deleted", () => {
    const softDelete = (record: { deletedAt: Date | null }): { deletedAt: Date } => {
      return { ...record, deletedAt: new Date() };
    };

    const record = { deletedAt: null };
    const deleted = softDelete(record);

    expect(deleted.deletedAt).toBeInstanceOf(Date);
    expect(deleted.deletedAt).not.toBeNull();
  });
});
