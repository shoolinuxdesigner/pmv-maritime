import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getPerformedBy } from "@/lib/permissions";
import { DEFAULT_DELIVERY_STEPS, DEFAULT_SERVICE_STANDARDS } from "@/lib/maritimeIcons";

export const dynamic = "force-dynamic";

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function formatServiceRecord(s) {
  if (!s) return null;
  return {
    ...s,
    _id: s._id.toString(),
    id: s._id.toString(),
    deliverySteps:
      Array.isArray(s.deliverySteps) && s.deliverySteps.length > 0
        ? s.deliverySteps
        : DEFAULT_DELIVERY_STEPS,
    serviceStandards:
      Array.isArray(s.serviceStandards) && s.serviceStandards.length > 0
        ? s.serviceStandards
        : DEFAULT_SERVICE_STANDARDS,
  };
}

// ─── GET ────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const allParam = searchParams.get("all");   // admin: include archived
    const slugParam = searchParams.get("slug"); // inner page: single service
    const idParam = searchParams.get("id");     // edit form: single service by _id

    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    // Single by ID (edit form)
    if (idParam) {
      const service = await db.collection("services").findOne({ _id: new ObjectId(idParam) });
      if (!service) return NextResponse.json({ error: "Service not found." }, { status: 404 });
      return NextResponse.json(formatServiceRecord(service));
    }

    // Single by slug (inner page)
    if (slugParam) {
      const service = await db.collection("services").findOne({ slug: slugParam, archived: false });
      if (!service) return NextResponse.json({ error: "Service not found." }, { status: 404 });
      return NextResponse.json(formatServiceRecord(service));
    }

    // Build query
    const query = allParam === "true" ? {} : { archived: false };

    const services = await db
      .collection("services")
      .find(query)
      .sort({ order: 1 })
      .toArray();

    return NextResponse.json(services.map(formatServiceRecord));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      icon,
      shortDesc,
      longDesc,
      highlights,
      deliverables,
      promise,
      brochureUrl,
      deliverySteps,
      serviceStandards,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Service Name is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    const lastService = await db.collection("services").findOne({}, { sort: { order: -1 } });
    const nextOrder = (lastService?.order || 0) + 1;

    const newService = {
      name: name.trim(),
      slug: generateSlug(name),
      category: category || "Maritime Consultancy",
      icon: icon || "MdOutlineAnchor",
      shortDesc: shortDesc || "",
      longDesc: longDesc || "",
      highlights: Array.isArray(highlights) ? highlights : [],
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      promise: promise || "",
      brochureUrl: (brochureUrl || "").trim(),
      deliverySteps:
        Array.isArray(deliverySteps) && deliverySteps.length > 0
          ? deliverySteps
          : DEFAULT_DELIVERY_STEPS,
      serviceStandards:
        Array.isArray(serviceStandards) && serviceStandards.length > 0
          ? serviceStandards
          : DEFAULT_SERVICE_STANDARDS,
      archived: false,
      order: nextOrder,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("services").insertOne(newService);

    // Create Notification
    const performedBy = getPerformedBy(request);
    await db.collection("notifications").insertOne({
      title: "Service Created",
      message: `Service "${name.trim()}" was created by ${performedBy}.`,
      category: "CMS",
      targetRole: "ALL",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      insertedId: result.insertedId.toString(),
      data: formatServiceRecord({ ...newService, _id: result.insertedId }),
      message: "Service created successfully.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PUT ────────────────────────────────────────────────────────────────────
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      category,
      icon,
      shortDesc,
      longDesc,
      highlights,
      deliverables,
      promise,
      brochureUrl,
      deliverySteps,
      serviceStandards,
    } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "ID and Name are required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    const updateData = {
      name: name.trim(),
      slug: generateSlug(name),
      category: category || "Maritime Consultancy",
      icon: icon || "MdOutlineAnchor",
      shortDesc: shortDesc || "",
      longDesc: longDesc || "",
      highlights: Array.isArray(highlights) ? highlights : [],
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      promise: promise || "",
      brochureUrl: (brochureUrl || "").trim(),
      deliverySteps:
        Array.isArray(deliverySteps) && deliverySteps.length > 0
          ? deliverySteps
          : DEFAULT_DELIVERY_STEPS,
      serviceStandards:
        Array.isArray(serviceStandards) && serviceStandards.length > 0
          ? serviceStandards
          : DEFAULT_SERVICE_STANDARDS,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("services").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Create Notification
    const performedBy = getPerformedBy(request);
    await db.collection("notifications").insertOne({
      title: "Service Updated",
      message: `Service "${name.trim()}" was updated by ${performedBy}.`,
      category: "CMS",
      targetRole: "ALL",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Service updated successfully." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PATCH (archive / restore or bulk reorder) ───────────────────────────────
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, archived, orderedIds } = body;

    const client = await clientPromise;
    const db = client.db("pmv_maritime");
    const performedBy = getPerformedBy(request);

    // Bulk sequence reorder
    if (Array.isArray(orderedIds)) {
      const bulkOps = orderedIds.map((docId, index) => ({
        updateOne: {
          filter: { _id: new ObjectId(docId) },
          update: { $set: { order: index + 1, updatedAt: new Date().toISOString() } },
        },
      }));

      if (bulkOps.length > 0) {
        await db.collection("services").bulkWrite(bulkOps);
      }

      // Create Notification
      await db.collection("notifications").insertOne({
        title: "Services Reordered",
        message: `Services sequence was updated by ${performedBy}.`,
        category: "CMS",
        targetRole: "ALL",
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Services sequence updated successfully.",
      });
    }

    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }

    // Get the service name before modifying it
    const service = await db.collection("services").findOne({ _id: new ObjectId(id) });
    const serviceName = service ? service.name : "Unknown Service";

    await db.collection("services").updateOne(
      { _id: new ObjectId(id) },
      { $set: { archived: !!archived, updatedAt: new Date().toISOString() } }
    );

    // Create Notification
    await db.collection("notifications").insertOne({
      title: archived ? "Service Archived" : "Service Restored",
      message: `Service "${serviceName}" was ${archived ? "archived" : "restored"} by ${performedBy}.`,
      category: "CMS",
      targetRole: "ALL",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: archived ? "Service archived." : "Service restored to Published.",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("pmv_maritime");
    const performedBy = getPerformedBy(request);

    // Get the service name before deleting it
    const service = await db.collection("services").findOne({ _id: new ObjectId(id) });
    const serviceName = service ? service.name : "Unknown Service";

    await db.collection("services").deleteOne({ _id: new ObjectId(id) });

    // Create Notification
    await db.collection("notifications").insertOne({
      title: "Service Deleted",
      message: `Service "${serviceName}" was deleted permanently by ${performedBy}.`,
      category: "CMS",
      targetRole: "ALL",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Service deleted permanently." });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
