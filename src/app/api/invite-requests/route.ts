// src/app/api/invite-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

interface InviteRequestBody {
  name: string;
  email: string;
  phone: string;
  company?: string;
  state?: string;
  cultures?: string[];
  farmSize?: string;
  projectTypes?: string[];
  message?: string;
}

const CULTURE_LABELS: Record<string, string> = {
  CANA: "Cana-de-açúcar",
  MILHO: "Milho",
  SOJA: "Soja",
  EUCALIPTO: "Eucalipto",
  CAFE: "Café",
  ALGODAO: "Algodão",
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  DANINHAS: "Detecção de Daninhas",
  FALHAS: "Detecção de Falhas",
  RESTITUICAO: "Restituição",
  MAPEAMENTO: "Mapeamento",
};

function generateInviteRequestEmail(data: InviteRequestBody): string {
  const culturesText = data.cultures?.length
    ? data.cultures.map((c) => CULTURE_LABELS[c] || c).join(", ")
    : "Não informado";

  const projectTypesText = data.projectTypes?.length
    ? data.projectTypes.map((p) => PROJECT_TYPE_LABELS[p] || p).join(", ")
    : "Não informado";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            padding: 40px 20px;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
          }
          .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            margin-top: 8px;
          }
          .content {
            padding: 40px 30px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-grid {
            margin-bottom: 32px;
          }
          .info-row {
            display: flex;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            width: 140px;
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
          }
          .info-value {
            flex: 1;
            font-size: 14px;
            color: #111827;
          }
          .message-section {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-top: 24px;
          }
          .message-label {
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .message-text {
            font-size: 14px;
            color: #374151;
            white-space: pre-wrap;
          }
          .footer {
            background-color: #f9fafb;
            padding: 24px 30px;
            text-align: center;
          }
          .footer-text {
            font-size: 12px;
            color: #9ca3af;
          }
          .badge {
            display: inline-block;
            background-color: #ecfdf5;
            color: #059669;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
            margin: 2px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <h1>Nova Solicitação de Convite</h1>
            <p>Um novo usuário está interessado na plataforma</p>
          </div>

          <div class="content">
            <div class="section-title">Informações de Contato</div>
            <div class="info-grid">
              <div class="info-row">
                <div class="info-label">Nome</div>
                <div class="info-value"><strong>${data.name}</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">Email</div>
                <div class="info-value"><a href="mailto:${data.email}" style="color: #059669;">${data.email}</a></div>
              </div>
              <div class="info-row">
                <div class="info-label">Telefone</div>
                <div class="info-value"><a href="tel:${data.phone}" style="color: #059669;">${data.phone}</a></div>
              </div>
              ${data.company ? `
              <div class="info-row">
                <div class="info-label">Empresa/Fazenda</div>
                <div class="info-value">${data.company}</div>
              </div>
              ` : ""}
              ${data.state ? `
              <div class="info-row">
                <div class="info-label">Estado</div>
                <div class="info-value">${data.state}</div>
              </div>
              ` : ""}
              ${data.farmSize ? `
              <div class="info-row">
                <div class="info-label">Área Estimada</div>
                <div class="info-value">${data.farmSize} hectares</div>
              </div>
              ` : ""}
            </div>

            <div class="section-title">Interesses</div>
            <div class="info-grid">
              <div class="info-row">
                <div class="info-label">Culturas</div>
                <div class="info-value">${culturesText}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Análises</div>
                <div class="info-value">${projectTypesText}</div>
              </div>
            </div>

            ${data.message ? `
            <div class="message-section">
              <div class="message-label">Mensagem</div>
              <div class="message-text">${data.message}</div>
            </div>
            ` : ""}
          </div>

          <div class="footer">
            <p class="footer-text">
              Para convidar este usuário, acesse o painel de administração do AgroEfficace.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - 3 requests per hour per IP
    const clientIp = getClientIp(req.headers);
    const rateLimit = checkRateLimit(
      `invite-request:${clientIp}`,
      rateLimiters.inviteRequest
    );

    if (!rateLimit.success) {
      const retryAfterSeconds = Math.ceil(
        (rateLimit.resetAt - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          error: "Muitas solicitações. Tente novamente mais tarde.",
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": retryAfterSeconds.toString() },
        }
      );
    }

    const body: InviteRequestBody = await req.json();

    // Validate required fields
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json(
        { error: "Nome, email e telefone são obrigatórios" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    // Check if email already exists in the system
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado no sistema" },
        { status: 409 }
      );
    }

    // Fetch all active admin users
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
      },
      select: {
        email: true,
        name: true,
      },
    });

    if (admins.length === 0) {
      console.error("No active admins found to receive invite request");
      return NextResponse.json(
        { error: "Não foi possível processar sua solicitação. Tente novamente mais tarde." },
        { status: 500 }
      );
    }

    const adminEmails = admins.map((admin) => admin.email);

    // Send email to all admins
    const emailResult = await resend.emails.send({
      from: "AgroEfficace <noreply@agroefficace.com.br>",
      to: adminEmails,
      subject: `Nova Solicitação de Convite - ${body.name}`,
      html: generateInviteRequestEmail(body),
    });

    if (emailResult.error) {
      console.error("Failed to send invite request email:", emailResult.error);
      return NextResponse.json(
        { error: "Erro ao enviar solicitação. Tente novamente mais tarde." },
        { status: 500 }
      );
    }

    // Log the request
    await prisma.auditLog.create({
      data: {
        action: "INVITE_REQUEST_SUBMITTED",
        entityType: "InviteRequest",
        metadata: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          company: body.company || null,
          state: body.state || null,
          cultures: body.cultures || [],
          farmSize: body.farmSize || null,
          projectTypes: body.projectTypes || [],
          notifiedAdmins: adminEmails,
        },
        ipAddress:
          req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada com sucesso! Nossa equipe entrará em contato em breve.",
    });
  } catch (error) {
    console.error("Error processing invite request:", error);
    return NextResponse.json(
      { error: "Erro inesperado. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
