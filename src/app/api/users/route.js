import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { SYSTEM_ROLES } from "@/lib/permissions";
import { hashPassword } from "@/lib/authCrypto";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ─── GET: List Users & Audit Logs ───────────────────────────────────────────
export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    const users = await db
      .collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const auditLogs = await db
      .collection("audit_logs")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Sanitize user records (remove password, plainRef, username)
    const sanitizedUsers = users.map((u) => {
      const { password, plainRef, username, ...safeUser } = u;
      return {
        ...safeUser,
        _id: u._id.toString(),
        hasPassword: Boolean(password),
      };
    });

    return NextResponse.json({
      users: sanitizedUsers,
      auditLogs: auditLogs.map((l) => ({ ...l, _id: l._id.toString() })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: Create New User Account ──────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      mobileNumber,
      role,
      sessionDurationHours,
      permissions,
      createdByName,
    } = body;

    if (!fullName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Full Name and Email Address are required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing email
    const existing = await db.collection("users").findOne({
      email: normalizedEmail,
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 400 }
      );
    }

    // Set an unguessable placeholder hash so account cannot be accessed until password is set
    const placeholderHash = await hashPassword(crypto.randomUUID() + Date.now());

    const newUser = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      mobileNumber: mobileNumber?.trim() || "",
      password: placeholderHash,
      role: role || SYSTEM_ROLES.ASSOCIATE,
      sessionDurationHours: Number(sessionDurationHours) || 12,
      permissions: Array.isArray(permissions) ? permissions : [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("users").insertOne(newUser);

    // Activity Notification
    await db.collection("notifications").insertOne({
      title: "New User Account Created",
      message: `Account for ${newUser.fullName} (${newUser.email}) was created by ${createdByName || "Super Admin"}.`,
      category: "CONTENT",
      targetRole: "SUPER_ADMIN",
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Audit Log Entry
    await db.collection("audit_logs").insertOne({
      action: "USER_CREATED",
      performedBy: createdByName || "Super Admin",
      targetUser: newUser.email,
      details: `Created account for ${newUser.fullName} (${newUser.email}) with role ${newUser.role}`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `User ${newUser.fullName} created successfully.`,
      insertedId: result.insertedId.toString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
