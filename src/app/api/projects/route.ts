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

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Check user permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { canUpload: true, status: true },
    });

    const permissionError = validateUserPermissions(user);
    if (permissionError) {
      return NextResponse.json(
        { error: permissionError.error },
        { status: permissionError.status },
      );
    }

    // Parse and validate input
    const body = await req.json();

    const input: ProjectInput = {
      projectName: body.projectName,
      projectTypes: body.projectTypes || [], // Changed to array
      culture: body.culture,
      notes: body.notes,
      files: body.files,
      userId: body.userId,
    };

    // Validation is now async (validates against config tables)
    const validationError = await validateProjectInput(input);
    if (validationError) {
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
        projectTypes: result.project.projectTypes,
        culture: result.project.culture,
        filesCount: result.project.filesProcessed,
      },
      session.user.id,
      ownerResult.ownerId,
      getClientIp(req),
      req.headers.get("user-agent") || null,
    );

    const endTime = Date.now();
    
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

  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";

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

    
    // Build where clause with search
    const whereClause: any = isAdmin ? {} : { userId: session.user.id };

    if (search) {
      // Build OR conditions - search in name, culture, and projectTypes array
      const orConditions: any[] = [
        // Search in name
        { name: { contains: search, mode: "insensitive" } },
        // Search in culture (now a string)
        { culture: { contains: search, mode: "insensitive" } },
        // Search in projectTypes array (has any matching element)
        { projectTypes: { has: search.toUpperCase() } },
      ];

      whereClause.OR = orConditions;
    }


    // Get total count
    const total = await prisma.project.count({ where: whereClause });

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

    const formattedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      projectTypes: (project as any).projectTypes || [], // Changed to array
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
