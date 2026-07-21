export type UserRole = "super_admin" | "department_manager" | "employee" | "accountant";

export type AccountantLevel = "accountant" | "auditor" | "accounting_manager";

export type Department = "hr" | "operations" | "accounts" | "marketing" | "sales";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: Department;
  employeeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  entryDate: Date;
  description: string;
  reference?: string;
  lines: JournalLine[];
  createdBy: string;
  createdAt: Date;
}

export interface JournalLine {
  id: string;
  entryId: string;
  accountId: string;
  account: Account;
  debit: number;
  credit: number;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  balance: number;
  isActive: boolean;
}

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export type AccountCategory =
  // Assets
  | "current_asset"
  | "fixed_asset"
  | "intangible_asset"
  // Liabilities
  | "current_liability"
  | "long_term_liability"
  // Equity
  | "equity"
  // Revenue
  | "revenue"
  // Expense
  | "expense"
  // Contra
  | "contra_asset";

export interface TrialBalanceEntry {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface IncomeStatement {
  salesRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  interestExpense: number;
  netIncome: number;
}

export interface BalanceSheet {
  assets: {
    current: number;
    fixed: number;
    intangible: number;
    total: number;
  };
  liabilities: {
    current: number;
    longTerm: number;
    total: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    netIncome: number;
    total: number;
  };
  totalLiabilitiesAndEquity: number;
}

export interface CashFlowStatement {
  operating: number;
  investing: number;
  financing: number;
  netChange: number;
  beginningCash: number;
  endingCash: number;
}

export interface FinancialRatios {
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
  profitability: {
    grossProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
  };
  solvency: {
    debtToAssets: number;
    debtToEquity: number;
    timesInterestEarned: number;
  };
  activity: {
    inventoryTurnover: number;
    accountsReceivableTurnover: number;
    totalAssetTurnover: number;
  };
}
