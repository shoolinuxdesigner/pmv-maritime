import clientPromise from "@/lib/mongodb";

const DEFAULT_MAINTENANCE_SETTING = {
  key: "maintenance_mode",
  isEnabled: false,
  bypassPasswords: [
    { label: "Standard Bypass (20 Mins)", password: "itspmv@2026", durationMinutes: 20 },
    { label: "Samir Admin Bypass (20 Hours)", password: "samir@2026", durationMinutes: 1200 },
    { label: "Chandan Admin Bypass (20 Hours)", password: "chandan@2026", durationMinutes: 1200 },
  ],
};

async function fetchMaintenanceDataFromDB() {
  try {
    const client = await clientPromise;
    const db = client.db("pmv_maritime");
    const doc = await db.collection("settings").findOne({ key: "maintenance_mode" });
    if (!doc) {
      return DEFAULT_MAINTENANCE_SETTING;
    }
    return {
      key: doc.key,
      isEnabled: Boolean(doc.isEnabled),
      bypassPasswords: doc.bypassPasswords && doc.bypassPasswords.length > 0
        ? doc.bypassPasswords
        : DEFAULT_MAINTENANCE_SETTING.bypassPasswords,
      updatedAt: doc.updatedAt,
      updatedBy: doc.updatedBy,
    };
  } catch (error) {
    console.error("Error reading maintenance_mode from DB:", error);
    return DEFAULT_MAINTENANCE_SETTING;
  }
}

// Direct live server lookup from DB (always synchronized across local & live stages)
export async function getMaintenanceStatus() {
  return await fetchMaintenanceDataFromDB();
}

export async function setMaintenanceStatus(isEnabled, bypassPasswords, performedBy = "Admin") {
  try {
    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    const updateDoc = {
      key: "maintenance_mode",
      isEnabled: Boolean(isEnabled),
      bypassPasswords: Array.isArray(bypassPasswords) && bypassPasswords.length > 0
        ? bypassPasswords
        : DEFAULT_MAINTENANCE_SETTING.bypassPasswords,
      updatedAt: new Date().toISOString(),
      updatedBy: performedBy,
    };

    await db.collection("settings").updateOne(
      { key: "maintenance_mode" },
      { $set: updateDoc },
      { upsert: true }
    );

    // Notify activity center
    try {
      await db.collection("notifications").insertOne({
        title: "Maintenance Mode Toggled",
        message: `System Maintenance Mode was turned ${isEnabled ? "ON" : "OFF"} by ${performedBy}.`,
        category: "System",
        targetRole: "ALL",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.warn("Could not insert notification log:", notifErr.message);
    }

    return { success: true, isEnabled: Boolean(isEnabled) };
  } catch (error) {
    console.error("Error setting maintenance_mode in DB:", error);
    throw error;
  }
}

export function checkMaintenanceBypass(bypassCookie) {
  if (!bypassCookie?.value) return false;
  const expiry = parseInt(bypassCookie.value, 10);
  return Number.isFinite(expiry) && Date.now() < expiry;
}


