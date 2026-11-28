import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getPerformedBy } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// GET: Fetch master records (optional module filter)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleParam = searchParams.get("module");

    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    const query = moduleParam ? { module: moduleParam } : {};
    const records = await db
      .collection("masters")
      .find(query)
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    const formattedData = records.map((item) => ({
      ...item,
      _id: item._id.toString(),
      id: item._id.toString(),
      createdBy: item.createdBy || "Super Administrator",
      updatedBy: item.updatedBy || (item.updatedAt ? "Super Administrator" : null),
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    return NextResponse.json(
      { error: `Database error: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST: Add new master record
export async function POST(request) {
  try {
    const body = await request.json();
    const { module: targetModule, name, status } = body;

    if (!targetModule || !name) {
      return NextResponse.json(
        { error: "Module and Name are required fields." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    const lastRecord = await db.collection("masters").findOne(
      { module: targetModule.trim() },
      { sort: { order: -1 } }
    );
    const nextOrder = (lastRecord?.order || 0) + 1;

    const performedBy = getPerformedBy(request);

    const newRecord = {
      module: targetModule.trim(),
      name: name.trim(),
      status: status ? status.trim() : "Active",
      order: nextOrder,
      createdBy: performedBy,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("masters").insertOne(newRecord);

    // Create Notification
    await db.collection("notifications").insertOne({
      title: "Master Category Created",
      message: `Master category "${name.trim()}" under module "${targetModule.trim()}" was created by ${performedBy}.`,
      category: "CMS",
      targetRole: "ALL",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      insertedId: result.insertedId.toString(),
      data: { ...newRecord, _id: result.insertedId.toString(), id: result.insertedId.toString() },
      message: "Master record created successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create master record: ${error.message}` },
      { status: 500 }
    );
  }
}

// PUT: Update master record
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, status } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID and Name are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    // Fetch existing record to check if name changed
    const existingRecord = await db
      .collection("masters")
      .findOne({ _id: new ObjectId(id) });

    const performedBy = getPerformedBy(request);
    const newName = name.trim();
    const updateData = {
      name: newName,
      status: status ? status.trim() : "Active",
      updatedBy: performedBy,
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .collection("masters")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    // Cascade update category name to services/projects if name changed
    if (
      existingRecord &&
      existingRecord.name !== newName
    ) {
      if (existingRecord.module === "services") {
        await db
          .collection("services")
          .updateMany(
            { category: existingRecord.name },
            { $set: { category: newName } }
          );
      } else if (existingRecord.module === "projects") {
        await db
          .collection("projects")
          .updateMany(
            { category: existingRecord.name },
            { $set: { category: newName } }
          );
      }
    }

    // Create Notification
    await db.collection("notifications").insertOne({
      title: "Master Category Updated",
      message: `Master category "${newName}" was updated by ${performedBy}.`,
      category: "CMS",
      targetRole: "ALL",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: "Master record updated successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update master record: ${error.message}` },
      { status: 500 }
    );
  }
}

// PATCH: Reorder master records sequence
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    const client = await clientPromise;
    const db = client.db("pmv_maritime");
    const performedBy = getPerformedBy(request);

    if (Array.isArray(orderedIds)) {
      const bulkOps = orderedIds.map((docId, index) => ({
        updateOne: {
          filter: { _id: new ObjectId(docId) },
          update: { $set: { order: index + 1, updatedAt: new Date().toISOString() } },
        },
      }));

      if (bulkOps.length > 0) {
        await db.collection("masters").bulkWrite(bulkOps);
      }

      // Create Notification
      await db.collection("notifications").insertOne({
        title: "Master Sequence Reordered",
        message: `Master category sequence was updated by ${performedBy}.`,
        category: "CMS",
        targetRole: "ALL",
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Master sequence updated successfully.",
      });
    }

    return NextResponse.json({ error: "orderedIds array is required." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete master record
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing ID parameter." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("pmv_maritime");
    const performedBy = getPerformedBy(request);

    // Get details before deleting
    const record = await db.collection("masters").findOne({ _id: new ObjectId(id) });
    const recordName = record ? record.name : "Unknown Master Category";

    const result = await db
      .collection("masters")
      .deleteOne({ _id: new ObjectId(id) });

    // Create Notification
    await db.collection("notifications").insertOne({
      title: "Master Category Deleted",
      message: `Master category "${recordName}" was deleted permanently by ${performedBy}.`,
      category: "CMS",
      targetRole: "ALL",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: "Master record deleted successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete master record: ${error.message}` },
      { status: 500 }
    );
  }
}
