import { NextRequest } from "next/server";
import { execSync } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function exec(cmd: string): string {
  try {
    return execSync(cmd, {
      cwd: process.cwd(),
      encoding: "utf-8",
      timeout: 120000,
      windowsHide: true,
    });
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return err.stdout || err.stderr || err.message || "";
  }
}

export async function POST(_req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      try {
        send("log", "جاري سحب آخر التحديثات من GitHub...");
        const pullOut = exec("git pull origin main 2>&1");
        send("log", pullOut);

        if (pullOut.includes("Already up to date")) {
          send("progress", "100");
          send("done", "النظام بالفعل محدث إلى آخر إصدار");
          controller.close();
          return;
        }

        send("log", "جاري تثبيت التبعيات...");
        const installOut = exec("npm install 2>&1");
        send("log", installOut);
        send("progress", "40");

        send("log", "جاري بناء النظام...");
        const buildOut = exec("npm run build 2>&1");
        send("log", buildOut);
        send("progress", "90");

        send("log", "جاري تحديث قاعدة البيانات...");
        const dbOut = exec("npx prisma db push 2>&1");
        send("log", dbOut);

        send("progress", "100");
        send("done", "تم التحديث بنجاح! يمكنك الآن تحديث الصفحة.");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "خطأ غير معروف";
        send("error", msg);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
