export interface JournalLineTemplate {
  accountId: string;
  label: string;
  side: "debit" | "credit";
  defaultAmount?: number;
}

export interface JournalTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  category: "operating" | "adjusting" | "closing" | "opening" | "reversing" | "advanced";
  description: string;
  lines: JournalLineTemplate[];
}

export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  // === OPENING ENTRIES ===
  {
    id: "opening_capital",
    nameAr: "قيد البدء - إثبات رأس المال",
    nameEn: "Opening Entry - Capital",
    category: "opening",
    description: "إثبات أصول المنشأة ورأس المال في بداية الفترة",
    lines: [
      { accountId: "CASH", label: "من حـ/ الصندوق", side: "debit" },
      { accountId: "INV", label: "من حـ/ المخزون", side: "debit" },
      { accountId: "CAPITAL", label: "إلى حـ/ رأس المال", side: "credit" },
    ],
  },
  // === OPERATING ENTRIES ===
  {
    id: "cash_sale",
    nameAr: "بيع نقدي",
    nameEn: "Cash Sale",
    category: "operating",
    description: "تسجيل مبيعات نقدية مع تكلفة البضاعة المباعة",
    lines: [
      { accountId: "CASH", label: "من حـ/ الصندوق (إيراد المبيعات)", side: "debit" },
      { accountId: "SALES_REV", label: "إلى حـ/ إيراد المبيعات", side: "credit" },
      { accountId: "COGS", label: "من حـ/ تكلفة البضاعة المباعة", side: "debit" },
      { accountId: "INV", label: "إلى حـ/ المخزون", side: "credit" },
    ],
  },
  {
    id: "credit_sale",
    nameAr: "بيع آجل (دين)",
    nameEn: "Credit Sale",
    category: "operating",
    description: "بيع بضاعة لأجل مع إثبات تكلفة البضاعة المباعة",
    lines: [
      { accountId: "AR", label: "من حـ/ العملاء (ذمم مدينة)", side: "debit" },
      { accountId: "SALES_REV", label: "إلى حـ/ إيراد المبيعات", side: "credit" },
      { accountId: "COGS", label: "من حـ/ تكلفة البضاعة المباعة", side: "debit" },
      { accountId: "INV", label: "إلى حـ/ المخزون", side: "credit" },
    ],
  },
  {
    id: "cash_purchase",
    nameAr: "شراء نقدي",
    nameEn: "Cash Purchase",
    category: "operating",
    description: "شراء بضاعة نقداً",
    lines: [
      { accountId: "INV", label: "من حـ/ المخزون", side: "debit" },
      { accountId: "CASH", label: "إلى حـ/ الصندوق", side: "credit" },
    ],
  },
  {
    id: "credit_purchase",
    nameAr: "شراء آجل",
    nameEn: "Credit Purchase",
    category: "operating",
    description: "شراء بضاعة بأجل من المورد",
    lines: [
      { accountId: "INV", label: "من حـ/ المخزون", side: "debit" },
      { accountId: "AP", label: "إلى حـ/ الموردون (ذمم دائنة)", side: "credit" },
    ],
  },
  {
    id: "collect_receivable",
    nameAr: "تحصيل دين من عميل",
    nameEn: "Collect Receivable",
    category: "operating",
    description: "تحصيل مبلغ مستحق من عميل آجل",
    lines: [
      { accountId: "CASH", label: "من حـ/ الصندوق", side: "debit" },
      { accountId: "AR", label: "إلى حـ/ العملاء (ذمم مدينة)", side: "credit" },
    ],
  },
  {
    id: "pay_payable",
    nameAr: "سداد دين لمورد",
    nameEn: "Pay Payable",
    category: "operating",
    description: "سداد مبلغ مستحق لمورد",
    lines: [
      { accountId: "AP", label: "من حـ/ الموردون (ذمم دائنة)", side: "debit" },
      { accountId: "CASH", label: "إلى حـ/ الصندوق", side: "credit" },
    ],
  },
  {
    id: "pay_rent",
    nameAr: "دفع إيجار",
    nameEn: "Pay Rent",
    category: "operating",
    description: "سداد إيجار المقر",
    lines: [
      { accountId: "RENT_EXP", label: "من حـ/ مصروف الإيجار", side: "debit" },
      { accountId: "CASH", label: "إلى حـ/ الصندوق", side: "credit" },
    ],
  },
  {
    id: "pay_salaries",
    nameAr: "صرف رواتب",
    nameEn: "Pay Salaries",
    category: "operating",
    description: "صرف رواتب الموظفين",
    lines: [
      { accountId: "SALARIES_EXP", label: "من حـ/ مصروف الرواتب", side: "debit" },
      { accountId: "CASH", label: "إلى حـ/ الصندوق", side: "credit" },
    ],
  },
  {
    id: "pay_utilities",
    nameAr: "دفع مصاريف مرافق",
    nameEn: "Pay Utilities",
    category: "operating",
    description: "دفع فاتورة كهرباء أو مياه أو هاتف",
    lines: [
      { accountId: "UTILITIES_EXP", label: "من حـ/ مصروف المرافق", side: "debit" },
      { accountId: "CASH", label: "إلى حـ/ الصندوق", side: "credit" },
    ],
  },
  {
    id: "owner_investment",
    nameAr: "إيداع مالك (رأس مال)",
    nameEn: "Owner Investment",
    category: "operating",
    description: "إيداع المالك مبلغ نقداً كرأس مال إضافي",
    lines: [
      { accountId: "CASH", label: "من حـ/ الصندوق", side: "debit" },
      { accountId: "CAPITAL", label: "إلى حـ/ رأس المال", side: "credit" },
    ],
  },
  {
    id: "owner_withdrawal",
    nameAr: "مسحوبات المالك",
    nameEn: "Owner Withdrawal",
    category: "operating",
    description: "سحب المالك مبلغ من الخزينة لحسابه الشخصي",
    lines: [
      { accountId: "DRAWINGS", label: "من حـ/ المسحوبات", side: "debit" },
      { accountId: "CASH", label: "إلى حـ/ الصندوق", side: "credit" },
    ],
  },
  {
    id: "purchase_furniture",
    nameAr: "شراء أثاث",
    nameEn: "Purchase Furniture",
    category: "operating",
    description: "شراء أثاث للمكتب",
    lines: [
      { accountId: "FURNITURE", label: "من حـ/ الأثاث", side: "debit" },
      { accountId: "CASH", label: "إلى حـ/ الصندوق", side: "credit" },
    ],
  },
  {
    id: "bank_deposit",
    nameAr: "إيداع بنكي",
    nameEn: "Bank Deposit",
    category: "operating",
    description: "إيداع مبلغ من الصندوق في الحساب البنكي",
    lines: [
      { accountId: "BANK", label: "من حـ/ البنك", side: "debit" },
      { accountId: "CASH", label: "إلى حـ/ الصندوق", side: "credit" },
    ],
  },
  {
    id: "bank_withdrawal",
    nameAr: "سحب بنكي",
    nameEn: "Bank Withdrawal",
    category: "operating",
    description: "سحب مبلغ من الحساب البنكي إلى الصندوق",
    lines: [
      { accountId: "CASH", label: "من حـ/ الصندوق", side: "debit" },
      { accountId: "BANK", label: "إلى حـ/ البنك", side: "credit" },
    ],
  },
  // === ADJUSTING ENTRIES ===
  {
    id: "depreciation",
    nameAr: "قيد إهلاك الأصول الثابتة",
    nameEn: "Depreciation Entry",
    category: "adjusting",
    description: "تسجيل إهلاك الأصول الثابتة عن الفترة",
    lines: [
      { accountId: "DEPRECIATION_EXP", label: "من حـ/ مصروف الإهلاك", side: "debit" },
      { accountId: "ACCUM_DEP_BUILD", label: "إلى حـ/ مجمع الإهلاك", side: "credit" },
    ],
  },
  {
    id: "depreciation_furniture",
    nameAr: "إهلاك الأثاث",
    nameEn: "Furniture Depreciation",
    category: "adjusting",
    description: "تسجيل إهلاك الأثاث عن الفترة",
    lines: [
      { accountId: "DEPRECIATION_EXP_FURN", label: "من حـ/ مصروف إهلاك الأثاث", side: "debit" },
      { accountId: "ACCUM_DEP_FURN", label: "إلى حـ/ مجمع إهلاك الأثاث", side: "credit" },
    ],
  },
  {
    id: "accrued_expense",
    nameAr: "مصروف مستحق (لم يُدفع)",
    nameEn: "Accrued Expense",
    category: "adjusting",
    description: "إثبات مصروف مستحقة لم تُدفع بعد (مثل فاتورة كهرباء)",
    lines: [
      { accountId: "UTILITIES_EXP", label: "من حـ/ مصروف المرافق", side: "debit" },
      { accountId: "ACCRUED", label: "إلى حـ/ المصروفات المستحقة", side: "credit" },
    ],
  },
  {
    id: "prepaid_expense",
    nameAr: "مصروف مقدم (تسوية)",
    nameEn: "Prepaid Expense Adjustment",
    category: "adjusting",
    description: "تحويل جزء من المصروف المقدم إلى مصروف الفترة الحالية",
    lines: [
      { accountId: "RENT_EXP", label: "من حـ/ مصروف الإيجار", side: "debit" },
      { accountId: "PREPAID", label: "إلى حـ/ المصروفات المقدمة", side: "credit" },
    ],
  },
  {
    id: "accrued_revenue",
    nameAr: "إيراد مستحق (لم يُقبض)",
    nameEn: "Accrued Revenue",
    category: "adjusting",
    description: "إثبات إيراد مستحق لم يُقبض بعد",
    lines: [
      { accountId: "AR", label: "من حـ/ العملاء (ذمم مدينة)", side: "debit" },
      { accountId: "SERVICE_REV", label: "إلى حـ/ إيراد الخدمات", side: "credit" },
    ],
  },
  {
    id: "deferred_tax_liability",
    nameAr: "ضريبة مؤجلة (التزام)",
    nameEn: "Deferred Tax Liability",
    category: "adjusting",
    description: "إثبات التزام الضريبة المؤجلة بسبب الفروق الزمنية",
    lines: [
      { accountId: "TAX_EXP_DEFERRED", label: "من حـ/ مصروف الضريبة المؤجلة", side: "debit" },
      { accountId: "DEFERRED_TAX_LIABILITY", label: "إلى حـ/ الضريبة المؤجلة (التزام)", side: "credit" },
    ],
  },
  {
    id: "deferred_tax_asset",
    nameAr: "ضريبة مؤجلة (أصل)",
    nameEn: "Deferred Tax Asset",
    category: "adjusting",
    description: "إثبات أصل الضريبة المؤجلة",
    lines: [
      { accountId: "DEFERRED_TAX_ASSET", label: "من حـ/ الضريبة المؤجلة (أصل)", side: "debit" },
      { accountId: "TAX_EXP_CURRENT", label: "إلى حـ/ مصروف الضريبة الحالية", side: "credit" },
    ],
  },
  {
    id: "current_tax",
    nameAr: "ضريبة الدخل الحالية المستحقة",
    nameEn: "Current Tax Expense",
    category: "adjusting",
    description: "إثبات ضريبة الدخل المستحقة على الحكومة عن الفترة",
    lines: [
      { accountId: "TAX_EXP_CURRENT", label: "من حـ/ مصروف ضريبة الدخل (الحالية)", side: "debit" },
      { accountId: "ACCRUED", label: "إلى حـ/ دائنو الضرائب (التزام)", side: "credit" },
    ],
  },
  // === REVERSING ENTRIES ===
  {
    id: "reverse_accrued",
    nameAr: "عكس قيد المصروف المستحق",
    nameEn: "Reverse Accrued Expense",
    category: "reversing",
    description: "عكس قيد التسوية للمصروف المستحق في أول الفترة الجديدة",
    lines: [
      { accountId: "ACCRUED", label: "من حـ/ المصروفات المستحقة", side: "debit" },
      { accountId: "UTILITIES_EXP", label: "إلى حـ/ مصروف المرافق", side: "credit" },
    ],
  },
  {
    id: "reverse_accrued_revenue",
    nameAr: "عكس قيد الإيراد المستحق",
    nameEn: "Reverse Accrued Revenue",
    category: "reversing",
    description: "عكس قيد التسوية للإيراد المستحق في أول الفترة الجديدة",
    lines: [
      { accountId: "SERVICE_REV", label: "من حـ/ إيراد الخدمات", side: "debit" },
      { accountId: "AR", label: "إلى حـ/ العملاء (ذمم مدينة)", side: "credit" },
    ],
  },
  // === CLOSING ENTRIES ===
  {
    id: "close_revenue",
    nameAr: "إقفال حسابات الإيرادات",
    nameEn: "Close Revenue Accounts",
    category: "closing",
    description: "إقفال جميع حسابات الإيرادات وتحويلها إلى ملخص الدخل",
    lines: [
      { accountId: "SALES_REV", label: "من حـ/ إيراد المبيعات", side: "debit" },
      { accountId: "SERVICE_REV", label: "من حـ/ إيراد الخدمات", side: "debit" },
      { accountId: "INTEREST_REV", label: "من حـ/ إيراد الفوائد", side: "debit" },
      { accountId: "OTHER_REV", label: "من حـ/ إيرادات أخرى", side: "debit" },
      { accountId: "INCOME_SUMMARY", label: "إلى حـ/ ملخص الدخل", side: "credit" },
    ],
  },
  {
    id: "close_expenses",
    nameAr: "إقفال حسابات المصروفات",
    nameEn: "Close Expense Accounts",
    category: "closing",
    description: "إقفال جميع حسابات المصروفات وتحويلها إلى ملخص الدخل",
    lines: [
      { accountId: "INCOME_SUMMARY", label: "من حـ/ ملخص الدخل", side: "debit" },
      { accountId: "COGS", label: "إلى حـ/ تكلفة البضاعة المباعة", side: "credit" },
      { accountId: "RENT_EXP", label: "إلى حـ/ مصروف الإيجار", side: "credit" },
      { accountId: "SALARIES_EXP", label: "إلى حـ/ مصروف الرواتب", side: "credit" },
      { accountId: "UTILITIES_EXP", label: "إلى حـ/ مصروف المرافق", side: "credit" },
      { accountId: "DEPRECIATION_EXP", label: "إلى حـ/ مصروف الإهلاك", side: "credit" },
      { accountId: "TAX_EXP_CURRENT", label: "إلى حـ/ مصروف الضريبة (الحالية)", side: "credit" },
      { accountId: "TAX_EXP_DEFERRED", label: "إلى حـ/ مصروف الضريبة (المؤجلة)", side: "credit" },
    ],
  },
  {
    id: "close_income_summary_profit",
    nameAr: "إقفال ملخص الدخل (ربح) إلى رأس المال",
    nameEn: "Close Income Summary (Profit) to Capital",
    category: "closing",
    description: "نقل صافي الربح من ملخص الدخل إلى رأس المال",
    lines: [
      { accountId: "INCOME_SUMMARY", label: "من حـ/ ملخص الدخل (صافي ربح)", side: "debit" },
      { accountId: "CAPITAL", label: "إلى حـ/ رأس المال", side: "credit" },
    ],
  },
  {
    id: "close_income_summary_loss",
    nameAr: "إقفال ملخص الدخل (خسارة) من رأس المال",
    nameEn: "Close Income Summary (Loss) from Capital",
    category: "closing",
    description: "خصم صافي الخسارة من رأس المال إلى ملخص الدخل",
    lines: [
      { accountId: "CAPITAL", label: "من حـ/ رأس المال", side: "debit" },
      { accountId: "INCOME_SUMMARY", label: "إلى حـ/ ملخص الدخل (صافي خسارة)", side: "credit" },
    ],
  },
  {
    id: "close_drawings",
    nameAr: "إقفال حساب المسحوبات إلى رأس المال",
    nameEn: "Close Drawings to Capital",
    category: "closing",
    description: "خصم المسحوبات من حساب رأس المال",
    lines: [
      { accountId: "CAPITAL", label: "من حـ/ رأس المال", side: "debit" },
      { accountId: "DRAWINGS", label: "إلى حـ/ المسحوبات", side: "credit" },
    ],
  },
  // === ADVANCED ENTRIES ===
  {
    id: "goodwill_impairment",
    nameAr: "خسارة انخفاض قيمة الشهرة",
    nameEn: "Goodwill Impairment",
    category: "advanced",
    description: "إثبات انخفاض القيمة العادلة للشهرة",
    lines: [
      { accountId: "GOODWILL_IMPAIRMENT", label: "من حـ/ خسارة انخفاض قيمة الشهرة", side: "debit" },
      { accountId: "GOODWILL", label: "إلى حـ/ الشهرة", side: "credit" },
    ],
  },
  {
    id: "asset_revaluation_up",
    nameAr: "إعادة تقييم أصل (زيادة)",
    nameEn: "Asset Revaluation Increase",
    category: "advanced",
    description: "إعادة تقييم أصل ثابت إلى قيمته العادلة (زيادة)",
    lines: [
      { accountId: "BUILDING", label: "من حـ/ المباني (الأصل)", side: "debit" },
      { accountId: "REVALUATION_RESERVE", label: "إلى حـ/ احتياطي إعادة التقييم", side: "credit" },
    ],
  },
  {
    id: "asset_revaluation_down",
    nameAr: "إعادة تقييم أصل (نقص)",
    nameEn: "Asset Revaluation Decrease",
    category: "advanced",
    description: "إعادة تقييم أصل ثابت إلى قيمته العادلة (نقص)",
    lines: [
      { accountId: "REVALUATION_RESERVE", label: "من حـ/ احتياطي إعادة التقييم", side: "debit" },
      { accountId: "BUILDING", label: "إلى حـ/ المباني (الأصل)", side: "credit" },
    ],
  },
  {
    id: "cancel_accumulated_depreciation",
    nameAr: "إلغاء مجمع الإهلاك (لإعادة التقييم)",
    nameEn: "Cancel Accumulated Depreciation",
    category: "advanced",
    description: "إلغاء مجمع الإهلاك المتراكم تمهيداً لإعادة التقييم",
    lines: [
      { accountId: "ACCUM_DEP_BUILD", label: "من حـ/ مجمع الإهلاك", side: "debit" },
      { accountId: "BUILDING", label: "إلى حـ/ المباني (الأصل)", side: "credit" },
    ],
  },
  {
    id: "monthly_inventory_periodic",
    nameAr: "تسوية المخزون (الجرد الدوري) - مخزون أول المدة",
    nameEn: "Periodic Inventory - Beginning Inventory",
    category: "operating",
    description: "إقفال رصيد مخزون أول المدة إلى ملخص الدخل (نظام الجرد الدوري)",
    lines: [
      { accountId: "INCOME_SUMMARY", label: "من حـ/ ملخص الدخل", side: "debit" },
      { accountId: "INV", label: "إلى حـ/ المخزون (أول المدة)", side: "credit" },
    ],
  },
  {
    id: "monthly_inventory_periodic_end",
    nameAr: "تسوية المخزون (الجرد الدوري) - مخزون آخر المدة",
    nameEn: "Periodic Inventory - Ending Inventory",
    category: "operating",
    description: "إثبات مخزون آخر المدة من الجرد الفعلي إلى ملخص الدخل",
    lines: [
      { accountId: "INV", label: "من حـ/ المخزون (آخر المدة)", side: "debit" },
      { accountId: "INCOME_SUMMARY", label: "إلى حـ/ ملخص الدخل", side: "credit" },
    ],
  },
  {
    id: "close_purchases_periodic",
    nameAr: "إقفال المشتريات (الجرد الدوري)",
    nameEn: "Close Purchases (Periodic)",
    category: "closing",
    description: "تحويل حساب المشتريات إلى ملخص الدخل (نظام الجرد الدوري)",
    lines: [
      { accountId: "INCOME_SUMMARY", label: "من حـ/ ملخص الدخل", side: "debit" },
      { accountId: "PURCHASES", label: "إلى حـ/ المشتريات", side: "credit" },
    ],
  },
];
