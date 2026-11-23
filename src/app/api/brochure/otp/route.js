import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { generateNumericOTP, hashOTP, verifyPassword } from "@/lib/authCrypto";
import { getTransporter } from "@/lib/nodemailer";
import { generateBrochureOtpEmailHTML } from "@/lib/emailTemplate";
import { getDirectDownloadUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    const client = await clientPromise;
    const db = client.db("pmv_maritime");

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION 1: SEND OTP
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "send-otp") {
      const { fullName, phone, email, serviceName, serviceSlug } = body;

      if (!fullName?.trim()) {
        return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
      }

      if (!phone?.trim()) {
        return NextResponse.json({ error: "Mobile number is required." }, { status: 400 });
      }

      if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Rate limiting: allow only 1 request per 60 seconds per email
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
      const recentOtp = await db.collection("brochure_otps").findOne({
        email: normalizedEmail,
        createdAt: { $gte: sixtySecondsAgo },
        verified: false,
      });

      if (recentOtp) {
        const remainingSecs = Math.max(
          1,
          60 - Math.floor((Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000)
        );
        return NextResponse.json(
          {
            error: `Please wait ${remainingSecs}s before requesting another verification code.`,
            retryAfterSeconds: remainingSecs,
          },
          { status: 429 }
        );
      }

      // Invalidate any older unverified OTPs for this email and service
      await db.collection("brochure_otps").updateMany(
        { email: normalizedEmail, serviceSlug: serviceSlug || "", verified: false },
        { $set: { verified: false, invalidatedReason: "SUPERSEDED" } }
      );

      // Generate 6-digit OTP and store hashed version
      const otp = generateNumericOTP(6);
      const otpHash = await hashOTP(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Format submission date & time string
      const dateTimeStr = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Insert tracking record into `queries` collection for Admin review
      const queryInsert = await db.collection("queries").insertOne({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        serviceName: (serviceName || "PMV Maritime Service").trim(),
        serviceSlug: (serviceSlug || "").trim(),
        sourceUrl: `/services/${(serviceSlug || "").trim()}`,
        status: "pending", // pending until verified; marked failed if expired or max attempts
        verified: false,
        archived: false,
        expiresAt,
        createdAt: new Date(),
        dateTime: dateTimeStr,
      });

      await db.collection("brochure_otps").insertOne({
        email: normalizedEmail,
        fullName: fullName.trim(),
        phone: phone.trim(),
        serviceName: (serviceName || "PMV Maritime Service").trim(),
        serviceSlug: (serviceSlug || "").trim(),
        otpHash,
        attempts: 0,
        verified: false,
        queryId: queryInsert.insertedId,
        expiresAt,
        createdAt: new Date(),
      });

      // Dispatch Email via nodemailer
      try {
        const transporter = getTransporter();
        const emailHtml = generateBrochureOtpEmailHTML({
          fullName: fullName.trim(),
          serviceName: (serviceName || "PMV Maritime Service").trim(),
          otp,
          expiryMinutes: 10,
        });

        const smtpUser = process.env.SMTP_USER;
        await transporter.sendMail({
          from: `"PMV Maritime Solutions" <${smtpUser}>`,
          to: normalizedEmail,
          subject: `${otp} is your PMV Maritime Brochure Verification Code`,
          html: emailHtml,
        });
      } catch (mailError) {
        console.error("Failed to send brochure OTP email:", mailError);
        return NextResponse.json(
          { error: "Could not send verification email. Please check your email or try again later." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Verification code sent to your email address.",
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTION 2: VERIFY OTP
    // ─────────────────────────────────────────────────────────────────────────
    if (action === "verify-otp") {
      const { email, otp, serviceSlug } = body;

      if (!email?.trim() || !otp?.trim()) {
        return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const cleanOtp = otp.trim();

      // Find active OTP record
      const otpRecord = await db.collection("brochure_otps").findOne(
        {
          email: normalizedEmail,
          serviceSlug: (serviceSlug || "").trim(),
          verified: false,
          expiresAt: { $gte: new Date() },
        },
        { sort: { createdAt: -1 } }
      );

      if (!otpRecord) {
        return NextResponse.json(
          { error: "Invalid or expired verification code. Please request a new one." },
          { status: 400 }
        );
      }

      // Check max failed attempts (5 max)
      if (otpRecord.attempts >= 5) {
        await db.collection("brochure_otps").updateOne(
          { _id: otpRecord._id },
          { $set: { invalidatedReason: "MAX_ATTEMPTS_EXCEEDED" } }
        );
        if (otpRecord.queryId) {
          await db.collection("queries").updateOne(
            { _id: otpRecord.queryId },
            { $set: { status: "failed", failedReason: "Max attempts exceeded" } }
          );
        }
        return NextResponse.json(
          { error: "Too many incorrect attempts. Please request a new verification code." },
          { status: 400 }
        );
      }

      // Verify OTP hash
      const isValid = await verifyPassword(cleanOtp, otpRecord.otpHash);
      if (!isValid) {
        const nextAttempts = (otpRecord.attempts || 0) + 1;
        await db.collection("brochure_otps").updateOne(
          { _id: otpRecord._id },
          { $inc: { attempts: 1 } }
        );
        if (nextAttempts >= 5 && otpRecord.queryId) {
          await db.collection("queries").updateOne(
            { _id: otpRecord.queryId },
            { $set: { status: "failed", failedReason: "Max attempts exceeded" } }
          );
        }
        return NextResponse.json(
          { error: "Incorrect verification code. Please double-check and try again." },
          { status: 400 }
        );
      }

      // Mark OTP as verified
      await db.collection("brochure_otps").updateOne(
        { _id: otpRecord._id },
        { $set: { verified: true, verifiedAt: new Date() } }
      );

      // Update tracking record in `queries` collection
      if (otpRecord.queryId) {
        await db.collection("queries").updateOne(
          { _id: otpRecord.queryId },
          { $set: { status: "verified", verified: true, verifiedAt: new Date() } }
        );
      } else {
        await db.collection("queries").updateMany(
          { email: normalizedEmail, serviceSlug: otpRecord.serviceSlug, status: "pending" },
          { $set: { status: "verified", verified: true, verifiedAt: new Date() } }
        );
      }

      // Record lead in brochure_leads
      await db.collection("brochure_leads").insertOne({
        fullName: otpRecord.fullName,
        phone: otpRecord.phone,
        email: otpRecord.email,
        serviceName: otpRecord.serviceName,
        serviceSlug: otpRecord.serviceSlug,
        createdAt: new Date(),
        dateTime: new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      });

      // Also create an in-app notification for the Admin dashboard
      await db.collection("notifications").insertOne({
        title: "Brochure Downloaded",
        message: `${otpRecord.fullName} (${otpRecord.email}) downloaded the brochure for "${otpRecord.serviceName}".`,
        category: "Submissions",
        targetRole: "ALL",
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Fetch the service's brochureUrl from MongoDB
      const service = await db.collection("services").findOne({ slug: otpRecord.serviceSlug });
      const rawBrochureUrl = (service?.brochureUrl || "").trim() || "/docs/services.pdf";
      const downloadUrl = getDirectDownloadUrl(rawBrochureUrl);

      return NextResponse.json({
        success: true,
        verified: true,
        downloadUrl,
        rawBrochureUrl,
        serviceName: otpRecord.serviceName,
        message: "Verification successful! Starting your brochure download...",
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error) {
    console.error("Brochure OTP error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}

