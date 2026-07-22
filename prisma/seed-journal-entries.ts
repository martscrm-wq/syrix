import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding journal entries for النور للتجارة والمقاولات...");

  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@syrix.com" },
  });
  if (!adminUser) {
    console.error("Admin user not found! Run seed-users.ts first.");
    return;
  }

  const getAccount = async (code: string) => {
    const a = await prisma.account.findUnique({ where: { code } });
    if (!a) throw new Error(`Account ${code} not found`);
    return a.id;
  };

  const CASH = await getAccount("CASH");
  const INV = await getAccount("INV");
  const CAPITAL = await getAccount("CAPITAL");
  const FURNITURE = await getAccount("FURNITURE");
  const AR = await getAccount("AR");
  const SALES_REV = await getAccount("SALES_REV");
  const COGS = await getAccount("COGS");
  const RENT_EXP = await getAccount("RENT_EXP");
  const SALARIES_EXP = await getAccount("SALARIES_EXP");
  const ACCUM_DEP_FURN = await getAccount("ACCUM_DEP_FURN");
  const DEPRECIATION_EXP_FURN = await getAccount("DEPRECIATION_EXP_FURN");
  const UTILITIES_EXP = await getAccount("UTILITIES_EXP");
  const ACCRUED = await getAccount("ACCRUED");
  const INCOME_SUMMARY = await getAccount("INCOME_SUMMARY");

  const existingEntries = await prisma.journalEntry.count();
  if (existingEntries > 0) {
    console.log(`Found ${existingEntries} existing entries. Skipping seed.`);
    return;
  }

  const entries = [
    // 1. Opening Entry - 2026/01/01
    {
      entryDate: new Date("2026-01-01"),
      description: "قيد إثبات بدء النشاط التجاري، بإيداع المالك مبلغ 100,000 ج.م نقداً وبضاعة بقيمة 20,000 ج.م، بموجب إيصال البنك وعقود التأسيس",
      reference: "إيصال إيداع رقم 1",
      category: "opening",
      lines: [
        { accountId: CASH, debit: 100000, credit: 0, description: "من حـ/ الصندوق" },
        { accountId: INV, debit: 20000, credit: 0, description: "من حـ/ المخزون السلعي" },
        { accountId: CAPITAL, debit: 0, credit: 120000, description: "إلى حـ/ رأس المال" },
      ],
    },
    // 2. Purchase Furniture - 2026/01/02
    {
      entryDate: new Date("2026-01-02"),
      description: "قيد شراء أثاث مكتبي (طاولات وكراسي) نقداً بموجب فاتورة المورد \"الأمل للأثاث\"، بقيمة 15,000 ج.م، شاملة الضريبة",
      reference: "فاتورة شراء رقم 101",
      category: "operating",
      lines: [
        { accountId: FURNITURE, debit: 15000, credit: 0, description: "من حـ/ الأثاث" },
        { accountId: CASH, debit: 0, credit: 15000, description: "إلى حـ/ الصندوق" },
      ],
    },
    // 3. Cash Purchase Inventory - 2026/01/05
    {
      entryDate: new Date("2026-01-05"),
      description: "قيد شراء بضاعة للبيع نقداً بموجب فاتورة المورد \"مستودعات العاصمة\"، عدد 1000 وحدة بسعر 30 ج.م للوحدة، بإجمالي 30,000 ج.م",
      reference: "فاتورة شراء رقم 205",
      category: "operating",
      lines: [
        { accountId: INV, debit: 30000, credit: 0, description: "من حـ/ المخزون السلعي (البضاعة)" },
        { accountId: CASH, debit: 0, credit: 30000, description: "إلى حـ/ الصندوق" },
      ],
    },
    // 4a. Cash Sale (Revenue) - 2026/01/10
    {
      entryDate: new Date("2026-01-10"),
      description: "قيد تحصيل قيمة مبيعات نقدية بموجب فاتورة البيع رقم 1، بقيمة 25,000 ج.م",
      reference: "فاتورة بيع رقم 1",
      category: "operating",
      lines: [
        { accountId: CASH, debit: 25000, credit: 0, description: "من حـ/ الصندوق" },
        { accountId: SALES_REV, debit: 0, credit: 25000, description: "إلى حـ/ إيراد المبيعات" },
      ],
    },
    // 4b. COGS for cash sale - 2026/01/10
    {
      entryDate: new Date("2026-01-10"),
      description: "قيد إثبات تخفيض المخزون بقيمة تكلفة البضاعة المباعة نقداً، والتي تبلغ 18,000 ج.م، وفقاً لكارت الصنف",
      reference: "إذن صرف المخزن",
      category: "operating",
      lines: [
        { accountId: COGS, debit: 18000, credit: 0, description: "من حـ/ تكلفة البضاعة المباعة (مصروف)" },
        { accountId: INV, debit: 0, credit: 18000, description: "إلى حـ/ المخزون السلعي" },
      ],
    },
    // 5a. Credit Sale (Revenue) - 2026/01/15
    {
      entryDate: new Date("2026-01-15"),
      description: "قيد بيع بضاعة للعميل \"محمد علي\" بأجل (30 يوم) بموجب فاتورة رقم 2، بقيمة 10,000 ج.م",
      reference: "فاتورة بيع رقم 2",
      category: "operating",
      lines: [
        { accountId: AR, debit: 10000, credit: 0, description: "من حـ/ العملاء (أوراق قبض/ذمم مدينة)" },
        { accountId: SALES_REV, debit: 0, credit: 10000, description: "إلى حـ/ إيراد المبيعات" },
      ],
    },
    // 5b. COGS for credit sale - 2026/01/15
    {
      entryDate: new Date("2026-01-15"),
      description: "قيد إثبات تكلفة البضاعة المباعة لأجل والتي تبلغ 7,000 ج.م",
      reference: "إذن صرف المخزن",
      category: "operating",
      lines: [
        { accountId: COGS, debit: 7000, credit: 0, description: "من حـ/ تكلفة البضاعة المباعة (مصروف)" },
        { accountId: INV, debit: 0, credit: 7000, description: "إلى حـ/ المخزون السلعي" },
      ],
    },
    // 6. Pay Rent - 2026/01/20
    {
      entryDate: new Date("2026-01-20"),
      description: "قيد سداد إيجار مقر المنشأة عن شهر يناير 2026، بموجب إيصال السيد المؤجر، بقيمة 3,000 ج.م",
      reference: "إيصال نقدي",
      category: "operating",
      lines: [
        { accountId: RENT_EXP, debit: 3000, credit: 0, description: "من حـ/ مصروف الإيجار" },
        { accountId: CASH, debit: 0, credit: 3000, description: "إلى حـ/ الصندوق" },
      ],
    },
    // 7. Pay Salaries - 2026/01/27
    {
      entryDate: new Date("2026-01-27"),
      description: "قيد صرف رواتب موظفي المنشأة عن شهر يناير بموجب كشف الرواتب المعتمد، بإجمالي 5,000 ج.م",
      reference: "كشف رواتب",
      category: "operating",
      lines: [
        { accountId: SALARIES_EXP, debit: 5000, credit: 0, description: "من حـ/ مصروف الرواتب" },
        { accountId: CASH, debit: 0, credit: 5000, description: "إلى حـ/ الصندوق" },
      ],
    },
    // 8. Collect Receivable - 2026/01/25
    {
      entryDate: new Date("2026-01-25"),
      description: "قيد تحصيل قيمة فاتورة البيع الآجل رقم 2 من العميل محمد علي، نقداً بالكامل، بموجب إيصال الاستلام رقم 3",
      reference: "إيصال استلام نقدي رقم 3",
      category: "operating",
      lines: [
        { accountId: CASH, debit: 10000, credit: 0, description: "من حـ/ الصندوق" },
        { accountId: AR, debit: 0, credit: 10000, description: "إلى حـ/ العملاء" },
      ],
    },
    // 9. Depreciation - 2026/01/31
    {
      entryDate: new Date("2026-01-31"),
      description: "قيد تسوية إهلاك الأثاث عن شهر يناير بقيمة 250 ج.م (15,000 ÷ 60 شهر)، لإظهار استهلاك الأصل خلال الفترة",
      reference: "حسابة الإهلاك",
      category: "adjusting",
      lines: [
        { accountId: DEPRECIATION_EXP_FURN, debit: 250, credit: 0, description: "من حـ/ مصروف إهلاك الأثاث" },
        { accountId: ACCUM_DEP_FURN, debit: 0, credit: 250, description: "إلى حـ/ مجمع إهلاك الأثاث" },
      ],
    },
    // 10. Accrued Utilities - 2026/01/31
    {
      entryDate: new Date("2026-01-31"),
      description: "قيد تسوية استحقاق فاتورة كهرباء وهاتف عن شهر يناير بقيمة 500 ج.م، ولم يتم سدادها بعد، وفقاً لكشوف الاستهلاك التقديرية",
      reference: "كشف استهلاك",
      category: "adjusting",
      lines: [
        { accountId: UTILITIES_EXP, debit: 500, credit: 0, description: "من حـ/ مصروف الكهرباء والهاتف" },
        { accountId: ACCRUED, debit: 0, credit: 500, description: "إلى حـ/ دائنون (مصروفات مستحقة)" },
      ],
    },
    // 11. Close Revenue - 2026/01/31
    {
      entryDate: new Date("2026-01-31"),
      description: "قيد إقفال رصيد إيراد المبيعات وتحويله إلى حساب ملخص الدخل في نهاية الفترة",
      reference: "إقفال إيرادات",
      category: "closing",
      lines: [
        { accountId: SALES_REV, debit: 35000, credit: 0, description: "من حـ/ إيراد المبيعات" },
        { accountId: INCOME_SUMMARY, debit: 0, credit: 35000, description: "إلى حـ/ ملخص الدخل" },
      ],
    },
    // 12. Close Expenses - 2026/01/31
    {
      entryDate: new Date("2026-01-31"),
      description: "قيد إقفال جميع حسابات المصروفات وتحويل أرصدتها المدينة إلى الجانب الدائن في ملخص الدخل",
      reference: "إقفال مصروفات",
      category: "closing",
      lines: [
        { accountId: INCOME_SUMMARY, debit: 33750, credit: 0, description: "من حـ/ ملخص الدخل" },
        { accountId: COGS, debit: 0, credit: 25000, description: "إلى حـ/ تكلفة البضاعة المباعة" },
        { accountId: RENT_EXP, debit: 0, credit: 3000, description: "إلى حـ/ مصروف الإيجار" },
        { accountId: SALARIES_EXP, debit: 0, credit: 5000, description: "إلى حـ/ مصروف الرواتب" },
        { accountId: DEPRECIATION_EXP_FURN, debit: 0, credit: 250, description: "إلى حـ/ مصروف الإهلاك" },
        { accountId: UTILITIES_EXP, debit: 0, credit: 500, description: "إلى حـ/ مصروف الكهرباء والهاتف" },
      ],
    },
    // 13. Close Income Summary to Capital - 2026/01/31
    {
      entryDate: new Date("2026-01-31"),
      description: "قيد إضافة صافي ربح الفترة إلى رأس المال، ليصبح رصيد رأس المال 121,250 ج.م",
      reference: "إقفال صافي الربح",
      category: "closing",
      lines: [
        { accountId: INCOME_SUMMARY, debit: 1250, credit: 0, description: "من حـ/ ملخص الدخل (صافي ربح)" },
        { accountId: CAPITAL, debit: 0, credit: 1250, description: "إلى حـ/ رأس المال" },
      ],
    },
    // 14. Reversing Entry - 2026/02/01
    {
      entryDate: new Date("2026-02-01"),
      description: "قيد عكسي لقيد التسوية الخاص بالمصروفات المستحقة، بهدف تسهيل تسجيل الفاتورة عند السداد لاحقاً",
      reference: "عكس قيد التسوية",
      category: "reversing",
      lines: [
        { accountId: ACCRUED, debit: 500, credit: 0, description: "من حـ/ دائنون (مصروفات مستحقة)" },
        { accountId: UTILITIES_EXP, debit: 0, credit: 500, description: "إلى حـ/ مصروف الكهرباء والهاتف" },
      ],
    },
  ];

  let count = 0;
  for (const entry of entries) {
    await prisma.journalEntry.create({
      data: {
        entryDate: entry.entryDate,
        description: entry.description,
        reference: entry.reference,
        category: entry.category,
        createdById: adminUser.id,
        lines: {
          create: entry.lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description,
          })),
        },
      },
    });
    count++;
    console.log(`  [${count}/${entries.length}] ${entry.category}: ${entry.reference}`);
  }

  console.log(`\nSeeded ${count} journal entries successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
