// src/app/api/users/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

  try {
    // Authentication check - admin only
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();

    const { name, email, phone, notes, role } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate role
    if (role !== "ADMIN" && role !== "USER") {
      return NextResponse.json(
        { error: "Role must be either ADMIN or USER" },
        { status: 400 },
      );
    }


    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }


    // Generate invitation token
    const invitationToken = generateInvitationToken();
    const invitationExpiresAt = new Date();
    invitationExpiresAt.setHours(invitationExpiresAt.getHours() + 48);

    
    // Create user in database
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


    // Create invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invitationLink = `${baseUrl}/accept-invite?token=${invitationToken}`;


    // Send invitation email via Resend
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


      // Check if Resend returned an error (they don't throw, they return error in response)
      if (emailResult.error) {
        console.error(
          "❌ [INVITE API] Failed to send invitation email:",
          emailResult.error,
        );

        // Delete the user if email fails to send
        await prisma.user.delete({
          where: { id: user.id },
        });

        return NextResponse.json(
          { error: "Failed to send invitation email. Please try again." },
          { status: 500 },
        );
      }

    } catch (emailError) {
      console.error(
        "❌ [INVITE API] Failed to send invitation email (exception):",
        emailError,
      );

      // Delete the user if email fails to send
      await prisma.user.delete({
        where: { id: user.id },
      });

      return NextResponse.json(
        { error: "Failed to send invitation email. Please try again." },
        { status: 500 },
      );
    }

    // Log the invitation action
    const clientIp = getClientIp(req);
    await prisma.auditLog.create({
      data: {
        action: "USER_INVITED",
        entityType: "User",
        entityId: user.id,
        userId: session.user.id, // Track which admin sent the invitation
        metadata: {
          email: user.email,
          role: user.role,
          invitedBy: session.user.email,
        },
        ipAddress: clientIp,
        userAgent: req.headers.get("user-agent") || null,
      },
    });


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
