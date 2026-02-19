// src/lib/email-templates/invitation-email.ts
interface InvitationEmailProps {
  name: string;
  role: string;
  invitationLink: string;
}

export function InvitationEmailTemplate({
  name,
  invitationLink,
}: InvitationEmailProps) {
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
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 16px;
            line-height: 1.7;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            background: #10b981;
            color: #ffffff !important;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
          }
          .divider {
            border-top: 1px solid #e5e7eb;
            margin: 32px 0;
          }
          .link-section {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 24px 0;
          }
          .link-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .link {
            color: #059669;
            word-break: break-all;
            font-size: 14px;
            font-family: monospace;
          }
          .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
          }
          .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .footer-note {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 16px;
          }
          .logo {
            font-size: 20px;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <img src="https://www.agroefficace.com.br/logo-branco.png" alt="AgroEfficace" width="200" style="margin-bottom: 16px;" />
            <h1>Bem-vindo ao AgroEfficace</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Olá, ${name}!</p>
            
            <p class="message">
              Você foi convidado para se juntar à plataforma AgroEfficace.
            </p>
            
            <p class="message">
              Para começar a usar a plataforma, clique no botão abaixo e configure sua senha de acesso:
            </p>
            
            <div class="button-container">
              <a href="${invitationLink}" class="button">Aceitar Convite</a>
            </div>
            
            <div class="divider"></div>
            
            <div class="link-section">
              <p class="link-label">Ou copie e cole este link no seu navegador:</p>
              <a href="${invitationLink}" class="link">${invitationLink}</a>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-text">⏰ Este convite expira em 48 horas</p>
            <p class="footer-note">
              Se você não esperava este convite, pode ignorar este e-mail com segurança.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
