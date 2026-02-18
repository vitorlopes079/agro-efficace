// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - 3 requests per 15 minutes per IP
    const clientIp = getClientIp(req.headers);
    const rateLimit = checkRateLimit(
      `reset-password:${clientIp}`,
      rateLimiters.passwordReset
    );

    if (!rateLimit.success) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetAt - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          error: "Muitas tentativas. Tente novamente mais tarde.",
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": retryAfterSeconds.toString() },
        }
      );
    }

    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find user by reset token
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 404 }
      );
    }

    // Check if expired
    if (user.passwordResetExpiresAt && new Date() > user.passwordResetExpiresAt) {
      return NextResponse.json(
        { error: "Reset token expired" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_COMPLETED",
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
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
