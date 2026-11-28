import { NextResponse } from "next/server";
import { getMaintenanceStatus, setMaintenanceStatus } from "@/lib/maintenance";
import { getPerformedBy } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Fetch current maintenance mode status and bypass passwords directly from DB
export async function GET() {
  try {
    const data = await getMaintenanceStatus();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch maintenance mode: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST / PUT: Update maintenance mode status & bypass passwords
export async function POST(request) {
  try {
    const body = await request.json();
    const { isEnabled, bypassPasswords } = body;

    const performedBy = getPerformedBy(request);
    const result = await setMaintenanceStatus(isEnabled, bypassPasswords, performedBy);

    return NextResponse.json({
      success: true,
      isEnabled: result.isEnabled,
      message: `Maintenance Mode is now ${result.isEnabled ? "ON" : "OFF"}.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update maintenance mode: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  return POST(request);
}
