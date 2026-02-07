# Agro Efficace 🌱

Plataforma segura para envio e processamento de arquivos geoespaciais agrícolas de grande porte.

## Stack

- Next.js 16 + TypeScript
- Prisma 7 + PostgreSQL (Supabase)
- NextAuth v4 (autenticação)
- Tailwind CSS + Recharts
- Cloudflare R2 (armazenamento)
- Resend (email)

## Instalação
```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Variáveis de Ambiente
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
RESEND_API_KEY="re_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Funcionalidades

**Administrador:**
- Gerenciamento de usuários (convidar, editar, banir, permissões)
- Visualização de métricas e gráficos de receita
- Acesso a todos os projetos e uploads
- Logs de auditoria do sistema
- Download e remoção de arquivos

**Usuário:**
- Upload de arquivos geoespaciais (TIF, TIFF, SHP, KML, GeoJSON)
- Criação e gerenciamento de projetos
- Download de resultados processados
- Dashboard pessoal com estatísticas

**Segurança:**
- Sistema de convites por email (token válido 48h)
- Autenticação JWT com roles (Admin/User)
- Proteção de rotas por middleware
- Senhas hasheadas (bcrypt)
- Links de download protegidos

## Estrutura
```
src/
├── app/
│   ├── (auth)/          # Login, aceitar convite
│   ├── (dashboard)/     # Área do usuário
│   ├── admin/           # Painel administrativo
│   └── api/             # API routes
├── components/
│   ├── ui/              # Componentes reutilizáveis
│   ├── layout/          # Header, Sidebar
│   └── charts/          # Gráficos
└── lib/
    ├── prisma.ts        # Database client
    ├── auth.ts          # NextAuth config
    └── email-templates/ # Templates de email
```

## Comandos Úteis
```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build para produção
npx prisma studio        # Interface visual do banco
npx prisma migrate dev   # Criar migration
```

## Fluxo de Convite

1. Admin convida usuário via email
2. Email enviado com link único (válido 48h)
3. Usuário cria senha e ativa conta
4. Status muda: PENDING → ACTIVE
5. Login liberado

## Armazenamento

**Cloudflare R2** (planejado):
- 10 GB grátis permanente
- Egress gratuito ilimitado
- ~$0.015/GB após free tier
- Compatível com API S3

**Custo estimado (500 GB):** ~$7.50/mês

## Deploy

Vercel - configure as variáveis de ambiente em produção.

---

Desenvolvido com 🌱 por Agro Efficace