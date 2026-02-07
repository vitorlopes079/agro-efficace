// src/app/api/auth/accept-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; // Precisamos instalar: npm install bcryptjs

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Find user by invitation token
    const user = await prisma.user.findUnique({
      where: { invitationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 },
      );
    }

    // Check if already accepted
    if (user.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Invitation already accepted" },
        { status: 400 },
      );
    }

    // Check if expired
    if (user.invitationExpiresAt && new Date() > user.invitationExpiresAt) {
      return NextResponse.json(
        { error: "Invitation expired" },
        { status: 400 },
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Activate the user and set password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "ACTIVE",
        password: hashedPassword,
        invitationToken: null,
        invitationExpiresAt: null,
        emailVerified: new Date(),
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_ACCEPTED_INVITE",
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
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
