// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  validateProjectInput,
  validateUserPermissions,
  type ProjectInput,
} from "@/lib/validation/project-validation";
import {
  createProjectWithFiles,
  determineProjectOwner,
  createAuditLog,
} from "@/lib/services/project-creation";
import { VALID_CULTURES, VALID_PROJECT_TYPES } from "@/lib/constants/project-constants";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log("🚀 [PROJECT API] Starting project creation...");

  try {
    // Authentication
    const session = await getServerSession(authOptions);
    console.log(
      "👤 [PROJECT API] Session:",
      session?.user?.email || "No session",
    );

    if (!session) {
      console.log("❌ [PROJECT API] No session found");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Check user permissions
    console.log("🔍 [PROJECT API] Checking user permissions...");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { canUpload: true, status: true },
    });
    console.log("📋 [PROJECT API] User status:", user);

    const permissionError = validateUserPermissions(user);
    if (permissionError) {
      console.log("⛔ [PROJECT API] Permission denied:", permissionError.error);
      return NextResponse.json(
        { error: permissionError.error },
        { status: permissionError.status },
      );
    }

    // Parse and validate input
    const body = await req.json();
    console.log("📦 [PROJECT API] Request body:", body);

    const input: ProjectInput = {
      projectName: body.projectName,
      projectType: body.projectType,
      culture: body.culture,
      notes: body.notes,
      files: body.files,
      userId: body.userId,
    };

    const validationError = validateProjectInput(input);
    if (validationError) {
      console.log("❌ [PROJECT API] Validation error:", validationError.error);
      return NextResponse.json(
        { error: validationError.error },
        { status: validationError.status },
      );
    }

    // Determine project owner
    const ownerResult = await determineProjectOwner(
      session.user.id,
      session.user.role === "ADMIN",
      input.userId,
    );

    if (ownerResult.error) {
      return NextResponse.json(
        { error: ownerResult.error.error },
        { status: ownerResult.error.status },
      );
    }

    // Create project with files
    const result = await createProjectWithFiles(
      input,
      ownerResult.ownerId,
      session.user.id,
    );

    if (!result.success || !result.project) {
      return NextResponse.json(
        { error: result.error || "Erro ao criar projeto" },
        { status: 500 },
      );
    }

    // Create audit log
    await createAuditLog(
      result.project.id,
      {
        name: result.project.name,
        projectType: result.project.projectType,
        culture: result.project.culture,
        filesCount: result.project.filesProcessed,
      },
      session.user.id,
      ownerResult.ownerId,
      getClientIp(req),
      req.headers.get("user-agent") || null,
    );

    const endTime = Date.now();
    console.log(
      `🎉 [PROJECT API] Project creation completed successfully in ${endTime - startTime}ms`,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Projeto criado com sucesso",
        project: result.project,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("💥 [PROJECT API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erro ao criar projeto" },
      { status: 500 },
    );
  }
}

const DEFAULT_PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  console.log("🚀 [PROJECT API] Fetching projects...");

  try {
    const session = await getServerSession(authOptions);
    console.log(
      "👤 [PROJECT API] Session:",
      session?.user?.email || "No session",
    );

    if (!session) {
      console.log("❌ [PROJECT API] No session found");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";
    console.log("🔐 [PROJECT API] Is admin:", isAdmin);

    // Parse pagination params
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(
      1,
      Math.min(
        100,
        parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10),
      ),
    );
    const skip = (page - 1) * limit;
    const search = searchParams.get("search")?.trim();

    console.log(
      `📊 [PROJECT API] Pagination - Page: ${page}, Limit: ${limit}, Skip: ${skip}`,
    );
    console.log(`🔍 [PROJECT API] Search query: "${search || "none"}"`);

    // Build where clause with search
    const whereClause: any = isAdmin ? {} : { userId: session.user.id };

    if (search) {
      console.log("🔍 [PROJECT API] Adding search filters...");

      const searchUpper = search.toUpperCase();

      // Build OR conditions
      const orConditions: any[] = [
        // Search in name (String field - supports contains)
        { name: { contains: search, mode: "insensitive" } },
      ];

      // Check if search matches any Culture enum value
      const matchingCulture = VALID_CULTURES.find((c) => c.includes(searchUpper));
      if (matchingCulture) {
        orConditions.push({ culture: matchingCulture });
      }

      // Check if search matches any ProjectType enum value
      const matchingProjectType = VALID_PROJECT_TYPES.find((pt) =>
        pt.includes(searchUpper),
      );
      if (matchingProjectType) {
        orConditions.push({ projectType: matchingProjectType });
      }

      whereClause.OR = orConditions;
    }

    console.log("💾 [PROJECT API] Where clause:", JSON.stringify(whereClause));

    // Get total count
    console.log("🔢 [PROJECT API] Counting total projects...");
    const total = await prisma.project.count({ where: whereClause });
    console.log(`✅ [PROJECT API] Total projects: ${total}`);

    console.log("💾 [PROJECT API] Querying database for projects...");
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            files: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    console.log(`✅ [PROJECT API] Found ${projects.length} projects`);

    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      projectType: project.projectType,
      culture: project.culture,
      status: project.status,
      notes: project.notes,
      filesCount: project._count.files,
      area: project.areaProcessed ? project.areaProcessed.toString() : null,
      price: project.price.toString(),
      userName: project.user.name,
      userEmail: project.user.email,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      completedAt: project.completedAt?.toISOString() || null,
    }));

    const totalPages = Math.ceil(total / limit);

    console.log("🎉 [PROJECT API] Projects fetch completed successfully");
    return NextResponse.json({
      projects: formattedProjects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("💥 [PROJECT API] Unexpected error:", error);
    console.error(
      "💥 [PROJECT API] Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    console.error("💥 [PROJECT API] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Erro ao buscar projetos",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
