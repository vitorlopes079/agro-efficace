// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";

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
    const session = await getServerSession(authOptions);
    console.log(
      "👤 [PROJECT API] Session:",
      session?.user?.email || "No session",
    );

    if (!session) {
      console.log("❌ [PROJECT API] No session found");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("🔍 [PROJECT API] Checking user permissions...");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { canUpload: true, status: true },
    });
    console.log("📋 [PROJECT API] User status:", user);

    if (user?.status === "SUSPENDED") {
      console.log("⛔ [PROJECT API] User is suspended");
      return NextResponse.json({ error: "Conta suspensa" }, { status: 403 });
    }

    if (!user?.canUpload) {
      console.log("⛔ [PROJECT API] User cannot upload");
      return NextResponse.json(
        { error: "Você não tem permissão para criar projetos" },
        { status: 403 },
      );
    }

    const body = await req.json();
    console.log("📦 [PROJECT API] Request body:", body);

    const { projectName, projectType, culture, notes, files, userId } = body;

    if (!projectName || !projectType || !culture) {
      console.log("❌ [PROJECT API] Missing required fields");
      return NextResponse.json(
        { error: "Nome, tipo e cultura são obrigatórios" },
        { status: 400 },
      );
    }

    // Validar que tem pelo menos 1 arquivo
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.log("❌ [PROJECT API] No files provided");
      return NextResponse.json(
        { error: "É necessário enviar pelo menos um arquivo" },
        { status: 400 },
      );
    }

    // Validar que tem pelo menos 1 ortomosaico
    const hasOrtomosaico = files.some(
      (f) => f.category === "INPUT_ORTOMOSAICO",
    );
    if (!hasOrtomosaico) {
      console.log("❌ [PROJECT API] No ortomosaico file");
      return NextResponse.json(
        { error: "É necessário enviar pelo menos um ortomosaico" },
        { status: 400 },
      );
    }

    const validProjectTypes = [
      "DANINHAS",
      "FALHAS",
      "RESTITUICAO",
      "MAPEAMENTO",
    ];
    const validCultures = [
      "CANA",
      "MILHO",
      "SOJA",
      "EUCALIPTO",
      "CAFE",
      "ALGODAO",
    ];

    const projectTypeUpper = projectType.toUpperCase();
    const cultureUpper = culture.toUpperCase();

    console.log("🔍 [PROJECT API] Validating projectType:", projectTypeUpper);
    if (!validProjectTypes.includes(projectTypeUpper)) {
      console.log("❌ [PROJECT API] Invalid project type");
      return NextResponse.json(
        { error: "Tipo de projeto inválido" },
        { status: 400 },
      );
    }

    console.log("🔍 [PROJECT API] Validating culture:", cultureUpper);
    if (!validCultures.includes(cultureUpper)) {
      console.log("❌ [PROJECT API] Invalid culture");
      return NextResponse.json({ error: "Cultura inválida" }, { status: 400 });
    }

    // Determine project owner
    let projectOwnerId = session.user.id;

    // If admin provides a userId, validate and use it
    if (session.user.role === "ADMIN" && userId) {
      console.log("🔍 [PROJECT API] Admin creating project for user:", userId);
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true, name: true },
      });

      if (!targetUser) {
        console.log("❌ [PROJECT API] Target user not found");
        return NextResponse.json(
          { error: "Usuário selecionado não encontrado" },
          { status: 400 },
        );
      }

      if (targetUser.status !== "ACTIVE") {
        console.log("❌ [PROJECT API] Target user is not active");
        return NextResponse.json(
          { error: "Usuário selecionado não está ativo" },
          { status: 400 },
        );
      }

      console.log(
        `✅ [PROJECT API] Creating project for user: ${targetUser.name}`,
      );
      projectOwnerId = userId;
    }

    console.log("💾 [PROJECT API] Creating project in database...");
    const project = await prisma.project.create({
      data: {
        name: projectName,
        projectType: projectTypeUpper,
        culture: cultureUpper,
        notes: notes || null,
        userId: projectOwnerId,
        status: "PENDING",
      },
    });
    console.log("✅ [PROJECT API] Project created:", project.id);

    // Process files in PARALLEL for better performance
    console.log(
      `📁 [PROJECT API] Processing ${files.length} files in parallel...`,
    );
    const fileProcessingStart = Date.now();

    const results = await Promise.allSettled(
      files.map(async (fileData) => {
        const fileStart = Date.now();
        console.log(
          `📄 [PROJECT API] Processing file: ${fileData.pendingUploadId}`,
        );

        // Fetch PendingUpload
        const pendingUpload = await prisma.pendingUpload.findUnique({
          where: { id: fileData.pendingUploadId },
        });

        if (!pendingUpload) {
          console.log(
            `⚠️ [PROJECT API] PendingUpload not found: ${fileData.pendingUploadId}`,
          );
          throw new Error(
            `PendingUpload not found: ${fileData.pendingUploadId}`,
          );
        }

        console.log(
          `📦 [PROJECT API] Found pending upload: ${pendingUpload.fileName}`,
        );

        // Determine folder based on category
        let categoryFolder = "perimetros";
        if (fileData.category === "INPUT_ORTOMOSAICO") {
          categoryFolder = "ortomosaico";
        } else if (fileData.category === "INPUT_OTHER") {
          categoryFolder = "outros";
        }

        // Extract filename from fileKey
        const fileName =
          pendingUpload.fileKey.split("/").pop() || pendingUpload.fileName;

        // New path in R2
        const newFileKey = `projects/${project.id}/input/${categoryFolder}/${fileName}`;

        console.log(
          `🔄 [PROJECT API] Moving file from ${pendingUpload.fileKey} to ${newFileKey}`,
        );

        // Copy file in R2
        const copyCommand = new CopyObjectCommand({
          Bucket: R2_BUCKET,
          CopySource: `${R2_BUCKET}/${pendingUpload.fileKey}`,
          Key: newFileKey,
        });
        await r2Client.send(copyCommand);
        console.log(`✅ [PROJECT API] File copied to new location`);

        // Delete old file
        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: pendingUpload.fileKey,
        });
        await r2Client.send(deleteCommand);
        console.log(`🗑️ [PROJECT API] Old file deleted from pending`);

        // Create File record and update PendingUpload in parallel
        await Promise.all([
          prisma.file.create({
            data: {
              projectId: project.id,
              fileName: pendingUpload.fileName,
              fileSize: pendingUpload.fileSize,
              fileType: pendingUpload.fileType,
              fileKey: newFileKey,
              fileCategory: fileData.category,
              uploadedBy: session.user.id,
            },
          }),
          prisma.pendingUpload.update({
            where: { id: fileData.pendingUploadId },
            data: { status: "CONFIRMED" },
          }),
        ]);

        const fileEnd = Date.now();
        console.log(
          `💾 [PROJECT API] File processed in ${fileEnd - fileStart}ms: ${pendingUpload.fileName}`,
        );

        return { success: true, fileName: pendingUpload.fileName };
      }),
    );

    const fileProcessingEnd = Date.now();
    console.log(
      `⚡ [PROJECT API] All files processed in ${fileProcessingEnd - fileProcessingStart}ms`,
    );

    // Count successes and failures
    const processedCount = results.filter(
      (r) => r.status === "fulfilled",
    ).length;
    const errorCount = results.filter((r) => r.status === "rejected").length;

    // Log any errors
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `❌ [PROJECT API] Error processing file ${files[index].pendingUploadId}:`,
          result.reason,
        );
      }
    });

    console.log(
      `📊 [PROJECT API] Files processed: ${processedCount} success, ${errorCount} errors`,
    );

    if (processedCount === 0) {
      console.log("❌ [PROJECT API] No files were processed successfully");
      // Delete project if no files were processed
      await prisma.project.delete({ where: { id: project.id } });
      return NextResponse.json(
        { error: "Erro ao processar arquivos" },
        { status: 500 },
      );
    }

    console.log("📝 [PROJECT API] Creating audit log...");
    await prisma.auditLog.create({
      data: {
        action: "PROJECT_CREATED",
        entityType: "Project",
        entityId: project.id,
        userId: session.user.id,
        metadata: {
          projectName: project.name,
          projectType: project.projectType,
          culture: project.culture,
          filesCount: processedCount,
          // Track if admin created for another user
          ...(projectOwnerId !== session.user.id
            ? { createdForUserId: projectOwnerId, createdByAdmin: true }
            : {}),
        },
        ipAddress: getClientIp(req),
        userAgent: req.headers.get("user-agent") || null,
      },
    });
    console.log("✅ [PROJECT API] Audit log created");

    const endTime = Date.now();
    console.log(
      `🎉 [PROJECT API] Project creation completed successfully in ${endTime - startTime}ms`,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Projeto criado com sucesso",
        project: {
          id: project.id,
          name: project.name,
          projectType: project.projectType,
          culture: project.culture,
          status: project.status,
          filesProcessed: processedCount,
          filesErrors: errorCount,
          createdAt: project.createdAt,
        },
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
      const cultures = [
        "CANA",
        "MILHO",
        "SOJA",
        "EUCALIPTO",
        "CAFE",
        "ALGODAO",
      ];
      const matchingCulture = cultures.find((c) => c.includes(searchUpper));
      if (matchingCulture) {
        orConditions.push({ culture: matchingCulture });
      }

      // Check if search matches any ProjectType enum value
      const projectTypes = ["DANINHAS", "FALHAS", "RESTITUICAO", "MAPEAMENTO"];
      const matchingProjectType = projectTypes.find((pt) =>
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
