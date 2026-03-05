// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { PasswordResetEmailTemplate } from "@/lib/email-templates/password-reset-email";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Rate limiting - 3 requests per 15 minutes per IP
    const clientIp = getClientIp(req.headers);
    const rateLimit = checkRateLimit(
      `forgot-password:${clientIp}`,
      rateLimiters.passwordReset,
    );

    if (!rateLimit.success) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetAt - Date.now()) / 1000,
      );
      return NextResponse.json(
        {
          error: "Muitas tentativas. Tente novamente mais tarde.",
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": retryAfterSeconds.toString() },
        },
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists and is active
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token with 1 hour expiration
    const passwordResetToken = generateResetToken();
    const passwordResetExpiresAt = new Date();
    passwordResetExpiresAt.setHours(passwordResetExpiresAt.getHours() + 1);

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiresAt,
      },
    });

    // Create reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${passwordResetToken}`;

    // Send password reset email
    const emailResult = await resend.emails.send({
      from: "AgroEfficace <noreply@agroefficace.com.br>",
      to: [email],
      subject: "Redefinição de senha - AgroEfficace",
      html: PasswordResetEmailTemplate({
        name: user.name,
        resetLink,
      }),
    });

    if (emailResult.error) {
      console.error("Failed to send password reset email:", emailResult.error);
      // Clear the token if email fails
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      });

      return NextResponse.json(
        { error: "Failed to send password reset email. Please try again." },
        { status: 500 },
      );
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        entityType: "User",
        entityId: user.id,
        metadata: {
          email: user.email,
        },
        ipAddress:
          req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("[forgot-password] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
