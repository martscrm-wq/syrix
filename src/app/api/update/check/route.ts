import { NextResponse } from "next/server";
import { BUILD_VERSION, BUILD_TIME } from "@/lib/build-info";

export async function GET() {
  try {
    const repo = "martscrm-wq/syrix";
    const ghRes = await fetch(`https://api.github.com/repos/${repo}/commits/main`, {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 0 },
    });

    if (!ghRes.ok) {
      return NextResponse.json({
        currentVersion: BUILD_VERSION,
        buildTime: BUILD_TIME,
        remote: null,
        error: "لا يمكن الاتصال بخادم التحديثات",
      });
    }

    const data = await ghRes.json();
    const remoteSha = data.sha?.slice(0, 7);
    const remoteDate = data.commit?.committer?.date || "";
    const remoteMessage = data.commit?.message?.split("\n")[0] || "";

    const localSha = BUILD_VERSION;

    return NextResponse.json({
      currentVersion: BUILD_VERSION,
      buildTime: BUILD_TIME,
      uptodate: true,
      remote: {
        sha: remoteSha,
        date: remoteDate,
        message: remoteMessage,
        url: data.html_url,
      },
    });
  } catch {
    return NextResponse.json({
      currentVersion: BUILD_VERSION,
      buildTime: BUILD_TIME,
      remote: null,
      error: "فشل الاتصال بالسيرفر",
    });
  }
}
