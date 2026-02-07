// src/app/api/auth/validate-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find user by invitation token
    const user = await prisma.user.findUnique({
      where: { invitationToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        invitationExpiresAt: true,
      },
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

    return NextResponse.json({
      valid: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
