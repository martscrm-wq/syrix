import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { entryDate, description, reference, lines } = body;

    if (!entryDate || !description || !lines || lines.length < 2) {
      return NextResponse.json(
        { error: "تاريخ القيد والوصف وبندان على الأقل مطلوبون" },
        { status: 400 }
      );
    }

    const totalDebit = lines.reduce((sum: number, l: { debit: number }) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, l: { credit: number }) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return NextResponse.json(
        {
          error: "القيد غير متوازن: مجموع المدين يجب أن يساوي مجموع الدائن",
          totalDebit,
          totalCredit,
          difference: totalDebit - totalCredit,
        },
        { status: 400 }
      );
    }

    const entry = await prisma.$transaction(async (tx) => {
      return tx.journalEntry.create({
        data: {
          entryDate: new Date(entryDate),
          description,
          reference,
          createdById: user.uid,
          lines: {
            create: lines.map((line: { accountId: string; debit?: number; credit?: number }) => ({
              accountId: line.accountId,
              debit: line.debit || 0,
              credit: line.credit || 0,
            })),
          },
        },
        include: {
          lines: {
            include: { account: true },
          },
        },
      });
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Journal entry error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء القيد المحاسبي" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 50);
  const skip = (page - 1) * limit;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  try {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.description = { contains: search, mode: "insensitive" };
    }

    if (category) {
      where.lines = {
        some: {
          account: {
            category: category,
          },
        },
      };
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          lines: {
            include: { account: true },
          },
          createdBy: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch journal entries error:", error);
    return NextResponse.json(
      { error: "فشل جلب القيود المحاسبية" },
      { status: 500 }
    );
  }
}
