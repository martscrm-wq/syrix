import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const chartOfAccounts = [
  // Assets - Current
  { code: "CASH", name: "Cash", nameAr: "النقدية", type: "asset", category: "current_asset" },
  { code: "BANK", name: "Bank", nameAr: "البنك", type: "asset", category: "current_asset" },
  { code: "AR", name: "Accounts Receivable", nameAr: "الذمم المدينة", type: "asset", category: "current_asset" },
  { code: "INV", name: "Inventory", nameAr: "المخزون", type: "asset", category: "current_asset" },
  { code: "PREPAID", name: "Prepaid Expenses", nameAr: "المصروفات المقدمة", type: "asset", category: "current_asset" },
  // Assets - Fixed
  { code: "LAND", name: "Land", nameAr: "الأراضي", type: "asset", category: "fixed_asset" },
  { code: "BUILDING", name: "Buildings", nameAr: "المباني", type: "asset", category: "fixed_asset" },
  { code: "MACHINERY", name: "Machinery", nameAr: "الآلات", type: "asset", category: "fixed_asset" },
  { code: "VEHICLES", name: "Vehicles", nameAr: "السيارات", type: "asset", category: "fixed_asset" },
  { code: "FURNITURE", name: "Furniture", nameAr: "الأثاث", type: "asset", category: "fixed_asset" },
  { code: "COMPUTERS", name: "Computers", nameAr: "أجهزة الكمبيوتر", type: "asset", category: "fixed_asset" },
  // Assets - Intangible
  { code: "GOODWILL", name: "Goodwill", nameAr: "الشهرة", type: "asset", category: "intangible_asset" },
  { code: "PATENTS", name: "Patents", nameAr: "براءات الاختراع", type: "asset", category: "intangible_asset" },
  { code: "SOFTWARE", name: "Software", nameAr: "البرمجيات", type: "asset", category: "intangible_asset" },
  // Liabilities - Current
  { code: "AP", name: "Accounts Payable", nameAr: "الذمم الدائنة", type: "liability", category: "current_liability" },
  { code: "ACCRUED", name: "Accrued Expenses", nameAr: "المصروفات المستحقة", type: "liability", category: "current_liability" },
  // Liabilities - Long-term
  { code: "LOANS", name: "Loans", nameAr: "القروض", type: "liability", category: "long_term_liability" },
  // Equity
  { code: "CAPITAL", name: "Capital", nameAr: "رأس المال", type: "equity", category: "equity" },
  { code: "ADDITIONAL_CAPITAL", name: "Additional Paid-in Capital", nameAr: "رأس مال إضافي", type: "equity", category: "equity" },
  { code: "CURRENT_ACCOUNT", name: "Owner's Current Account", nameAr: "الحساب الجاري للشريك", type: "equity", category: "equity" },
  { code: "RETAINED_EARNINGS", name: "Retained Earnings", nameAr: "الأرباح المرحلة", type: "equity", category: "equity" },
  { code: "CURRENT_PROFIT", name: "Current Year Profit/Loss", nameAr: "أرباح/خسائر العام الحالي", type: "equity", category: "equity" },
  // Revenue
  { code: "SALES_REV", name: "Sales Revenue", nameAr: "إيراد المبيعات", type: "revenue", category: "revenue" },
  { code: "SERVICE_REV", name: "Service Revenue", nameAr: "إيراد الخدمات", type: "revenue", category: "revenue" },
  { code: "INTEREST_REV", name: "Interest Revenue", nameAr: "إيراد الفوائد", type: "revenue", category: "revenue" },
  { code: "OTHER_REV", name: "Other Income", nameAr: "إيرادات أخرى", type: "revenue", category: "revenue" },
  // Expenses
  { code: "RENT_EXP", name: "Rent Expense", nameAr: "مصروف الإيجار", type: "expense", category: "expense" },
  { code: "SALARIES_EXP", name: "Salaries Expense", nameAr: "مصروف المرتبات", type: "expense", category: "expense" },
  { code: "UTILITIES_EXP", name: "Utilities Expense", nameAr: "مصروف المرافق", type: "expense", category: "expense" },
  { code: "ADVERTISING_EXP", name: "Advertising Expense", nameAr: "مصروف الإعلانات", type: "expense", category: "expense" },
  { code: "SUPPLIES_EXP", name: "Supplies Expense", nameAr: "مصروف المستلزمات", type: "expense", category: "expense" },
  { code: "DEPRECIATION_EXP", name: "Depreciation Expense", nameAr: "مصروف الإهلاك", type: "expense", category: "expense" },
  { code: "INSURANCE_EXP", name: "Insurance Expense", nameAr: "مصروف التأمين", type: "expense", category: "expense" },
  { code: "INTEREST_EXP", name: "Interest Expense", nameAr: "مصروف الفوائد", type: "expense", category: "expense" },
  { code: "BANK_CHARGES", name: "Bank Charges", nameAr: "المصاريف البنكية", type: "expense", category: "expense" },
  { code: "MAINTENANCE_EXP", name: "Repairs & Maintenance", nameAr: "مصروف الصيانة", type: "expense", category: "expense" },
  { code: "TRAVEL_EXP", name: "Travel Expense", nameAr: "مصروف السفر", type: "expense", category: "expense" },
  { code: "BAD_DEBT_EXP", name: "Bad Debt Expense", nameAr: "مصروف الديون المعدومة", type: "expense", category: "expense" },
  { code: "MISC_EXP", name: "Miscellaneous Expense", nameAr: "مصروف متنوعة", type: "expense", category: "expense" },
  { code: "OFFICE_EXP", name: "Office Expense", nameAr: "مصروف عمومية", type: "expense", category: "expense" },
  // Missing accounts per requirements
  { code: "TRADEMARKS", name: "Trademarks", nameAr: "العلامات التجارية", type: "asset", category: "intangible_asset" },
  { code: "ACCUM_DEP", name: "Accumulated Depreciation", nameAr: "مجمع الإهلاك", type: "asset", category: "contra_asset" },
  { code: "DRAWINGS", name: "Drawings", nameAr: "المسحوبات", type: "equity", category: "equity" },
  { code: "COGS", name: "Cost of Goods Sold", nameAr: "تكلفة البضاعة المباعة", type: "expense", category: "expense" },
];

async function main() {
  console.log("Seeding chart of accounts...");

  for (const account of chartOfAccounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: account,
      create: account,
    });
  }

  console.log(`Seeded ${chartOfAccounts.length} accounts`);

  // Seed departments
  const departments = [
    { id: "hr", name: "الموارد البشرية" },
    { id: "ops", name: "العمليات" },
    { id: "acc", name: "الحسابات" },
    { id: "mkt", name: "التسويق" },
    { id: "sales", name: "المبيعات" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: dept,
      create: dept,
    });
  }

  console.log("Seeded departments");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
