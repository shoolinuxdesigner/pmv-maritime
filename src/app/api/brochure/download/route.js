import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getDirectDownloadUrl } from "@/lib/utils";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const customUrl = searchParams.get("url");

    let brochureUrl = customUrl ? customUrl.trim() : "";
    let serviceName = "PMV Maritime Service";

    if (slug) {
      try {
        const client = await clientPromise;
        const db = client.db("pmv_maritime");
        const service = await db.collection("services").findOne({ slug });
        if (service) {
          serviceName = service.name || serviceName;
          if (!brochureUrl && service.brochureUrl) {
            brochureUrl = service.brochureUrl.trim();
          }
        }
      } catch (dbErr) {
        console.error("Error fetching service for brochure download:", dbErr);
      }
    }

    const safeFileName = `${(serviceName || "PMV-Maritime-Service")
      .replace(/[^a-zA-Z0-9_\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")}-Brochure.pdf`;

    // 1. Fallback to default local file if none provided
    if (!brochureUrl || brochureUrl === "/docs/services.pdf") {
      const localFilePath = path.join(process.cwd(), "public", "docs", "services.pdf");
      if (fs.existsSync(localFilePath)) {
        const fileBuffer = await fs.promises.readFile(localFilePath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${safeFileName}"`,
          },
        });
      }
    }

    // 2. Local relative file
    if (brochureUrl.startsWith("/") && !brochureUrl.startsWith("//")) {
      const localFilePath = path.join(process.cwd(), "public", brochureUrl.slice(1));
      if (fs.existsSync(localFilePath)) {
        const fileBuffer = await fs.promises.readFile(localFilePath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${safeFileName}"`,
          },
        });
      }
    }

    // 3. Remote URL (Google Drive / Docs / External PDF)
    const directUrl = getDirectDownloadUrl(brochureUrl);

    // Attempt server-side streaming if directUrl is accessible
    try {
      const response = await fetch(directUrl, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (response.ok) {
        const cType = response.headers.get("content-type") || "";
        if (
          cType.includes("pdf") ||
          cType.includes("octet-stream") ||
          cType.includes("application/")
        ) {
          const buffer = await response.arrayBuffer();
          return new NextResponse(Buffer.from(buffer), {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${safeFileName}"`,
            },
          });
        }
      }
    } catch (streamErr) {
      console.warn("Server streaming could not complete, falling back to direct redirect:", streamErr.message);
    }

    // If server cannot stream directly (e.g. Google auth or cookie required), 302 redirect to direct download link
    // The browser will receive the download directly without opening a new tab
    return NextResponse.redirect(directUrl, { status: 302 });
  } catch (error) {
    console.error("Brochure download handler error:", error);
    try {
      const localFilePath = path.join(process.cwd(), "public", "docs", "services.pdf");
      if (fs.existsSync(localFilePath)) {
        const fileBuffer = await fs.promises.readFile(localFilePath);
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="PMV_Maritime_Brochure.pdf"`,
          },
        });
      }
    } catch {}
    return NextResponse.json({ error: "Failed to download brochure." }, { status: 500 });
  }
}

