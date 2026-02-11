// src/app/api/auth/validate-reset-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find user by reset token
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        passwordResetExpiresAt: true,
      },
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

    return NextResponse.json({
      valid: true,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error validating reset token:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
