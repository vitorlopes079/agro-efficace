// src/app/api/users/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { InvitationEmailTemplate } from "@/lib/email-templates/invitation-email";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to generate secure random token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper function to get client IP
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  console.log("🚀 [INVITE API] Starting invitation process...");

  try {
    // Parse request body
    const body = await req.json();
    console.log("📦 [INVITE API] Request body:", body);

    const { name, email, phone, notes, role } = body;

    // Validate required fields
    if (!name || !email || !role) {
      console.log("❌ [INVITE API] Validation failed: Missing required fields");
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ [INVITE API] Validation failed: Invalid email format");
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate role
    if (role !== "ADMIN" && role !== "USER") {
      console.log("❌ [INVITE API] Validation failed: Invalid role");
      return NextResponse.json(
        { error: "Role must be either ADMIN or USER" },
        { status: 400 },
      );
    }

    console.log("✅ [INVITE API] Validation passed");

    // Check if user already exists
    console.log("🔍 [INVITE API] Checking for existing user...");
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("❌ [INVITE API] User already exists:", email);
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    console.log("✅ [INVITE API] No existing user found");

    // Generate invitation token
    const invitationToken = generateInvitationToken();
    const invitationExpiresAt = new Date();
    invitationExpiresAt.setHours(invitationExpiresAt.getHours() + 48);

    console.log(
      "🔑 [INVITE API] Generated invitation token:",
      invitationToken.substring(0, 10) + "...",
    );
    console.log("⏰ [INVITE API] Token expires at:", invitationExpiresAt);

    // Create user in database
    console.log("💾 [INVITE API] Creating user in database...");
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone: phone || null,
        notes: notes || null,
        role,
        status: "PENDING",
        invitationToken,
        invitationExpiresAt,
      },
    });

    console.log("✅ [INVITE API] User created successfully:", user.id);

    // Create invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invitationLink = `${baseUrl}/accept-invite?token=${invitationToken}`;

    console.log("🔗 [INVITE API] Invitation link:", invitationLink);

    // Send invitation email via Resend
    console.log("📧 [INVITE API] Sending invitation email...");
    try {
      const emailResult = await resend.emails.send({
        from: "AgroEfficace <noreply@agroefficace.com.br>",
        to: [email],
        subject: "You've been invited to AgroEfficace",
        html: InvitationEmailTemplate({
          name,
          role,
          invitationLink,
        }),
      });

      console.log("📧 [INVITE API] Email result:", emailResult);

      // Check if Resend returned an error (they don't throw, they return error in response)
      if (emailResult.error) {
        console.error(
          "❌ [INVITE API] Failed to send invitation email:",
          emailResult.error,
        );

        // Delete the user if email fails to send
        console.log("🗑️ [INVITE API] Deleting user due to email failure...");
        await prisma.user.delete({
          where: { id: user.id },
        });

        return NextResponse.json(
          { error: "Failed to send invitation email. Please try again." },
          { status: 500 },
        );
      }

      console.log("✅ [INVITE API] Email sent successfully");
    } catch (emailError) {
      console.error(
        "❌ [INVITE API] Failed to send invitation email (exception):",
        emailError,
      );

      // Delete the user if email fails to send
      console.log("🗑️ [INVITE API] Deleting user due to email failure...");
      await prisma.user.delete({
        where: { id: user.id },
      });

      return NextResponse.json(
        { error: "Failed to send invitation email. Please try again." },
        { status: 500 },
      );
    }

    // Log the invitation action
    console.log("📝 [INVITE API] Creating audit log...");
    const clientIp = getClientIp(req);
    await prisma.auditLog.create({
      data: {
        action: "USER_INVITED",
        entityType: "User",
        entityId: user.id,
        metadata: {
          email: user.email,
          role: user.role,
        },
        ipAddress: clientIp,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    console.log("✅ [INVITE API] Audit log created");
    console.log("🎉 [INVITE API] Invitation process completed successfully");

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: "Invitation sent successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
        invitationLink,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("💥 [INVITE API] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
