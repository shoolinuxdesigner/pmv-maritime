import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

// ─── GET: Fetch all brochure download queries ────────────────────────────────
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    // Automatically mark any pending queries that have expired (10 mins) as failed
    try {
      await db.collection("queries").updateMany(
        {
          status: "pending",
          expiresAt: { $lt: new Date() },
        },
        {
          $set: {
            status: "failed",
            failedReason: "Verification expired",
          },
        }
      );
    } catch (e) {
      console.warn("Could not auto-expire pending queries:", e.message);
    }

    // One-time sync: import any historical brochure_leads into queries if queries is empty
    try {
      const existingCount = await db.collection("queries").countDocuments();
      if (existingCount === 0) {
        const pastLeads = await db.collection("brochure_leads").find({}).toArray();
        if (pastLeads.length > 0) {
          const leadDocs = pastLeads.map((lead) => ({
            fullName: lead.fullName || "N/A",
            phone: lead.phone || "N/A",
            email: lead.email || "N/A",
            serviceName: lead.serviceName || "PMV Maritime Service",
            serviceSlug: lead.serviceSlug || "",
            sourceUrl: `/services/${lead.serviceSlug || ""}`,
            status: "verified",
            verified: true,
            archived: false,
            createdAt: lead.createdAt || new Date(),
            dateTime: lead.dateTime || new Date().toLocaleString(),
          }));
          await db.collection("queries").insertMany(leadDocs);
        }
      }
    } catch (e) {
      console.warn("Sync from brochure_leads failed:", e.message);
    }

    const queries = await db
      .collection("queries")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formattedData = queries.map((item) => ({
      ...item,
      _id: item._id.toString(),
      archived: Boolean(item.archived),
      status: item.status || (item.verified ? "verified" : "failed"),
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("GET /api/queries error:", error);
    return NextResponse.json(
      { error: `Database error: ${error.message}` },
      { status: 500 }
    );
  }
}

// ─── PATCH: Archive or Restore a query ───────────────────────────────────────
export async function PATCH(request) {
  try {
    const { id, action } = await request.json();
    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing id or action parameter." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    const isArchived = action === "archive";
    const result = await db
      .collection("queries")
      .updateOne({ _id: new ObjectId(id) }, { $set: { archived: isArchived } });

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      archived: isArchived,
    });
  } catch (error) {
    console.error("PATCH /api/queries error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Permanently delete a query ──────────────────────────────────────
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    const result = await db
      .collection("queries")
      .deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("DELETE /api/queries error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

