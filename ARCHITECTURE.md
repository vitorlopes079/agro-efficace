# Agro Efficace - Project Architecture

## Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (Header, global styles)
│   ├── page.tsx            # Home page (dashboard)
│   ├── globals.css         # Global styles
│   ├── (auth)/             # Auth route group (login, register)
│   │   └── login/
│   │       └── page.tsx
│   ├── projects/           # Projects feature
│   │   ├── page.tsx        # Projects list
│   │   └── [id]/
│   │       └── page.tsx    # Project details
│   └── api/                # API routes
│       └── projects/
│           └── route.ts
│
├── components/
│   ├── layout/             # Layout components (Header, Footer, Sidebar)
│   │   ├── header.tsx
│   │   └── index.ts        # Barrel export
│   └── ui/                 # Reusable UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── index.ts
│
├── lib/                    # Utilities and configurations
│   ├── prisma.ts           # Prisma client singleton
│   ├── supabase.ts         # Supabase client
│   └── utils.ts            # Helper functions
│
├── types/                  # TypeScript type definitions
│   └── index.ts            # Shared types
│
└── generated/              # Auto-generated code (Prisma)
    └── prisma/

prisma/
├── schema.prisma           # Database schema
└── migrations/             # Database migrations
```

## Key Principles

### 1. Keep It Simple
- Don't create abstractions until you need them
- Flat file structure when possible
- Only add folders when grouping makes sense

### 2. Colocation
- Keep related files together
- Feature-specific components live in their route folder
- Only extract to `components/` when shared across multiple pages

### 3. Single Source of Truth
- Types in `src/types/`
- Database schema in `prisma/schema.prisma`
- Environment variables in `.env.local`

## Naming Conventions

### Files
- **Components**: `kebab-case.tsx` (e.g., `header.tsx`, `stat-card.tsx`)
- **Pages**: `page.tsx` (Next.js convention)
- **API Routes**: `route.ts` (Next.js convention)
- **Utilities**: `kebab-case.ts` (e.g., `format-date.ts`)
- **Types**: `kebab-case.ts` or in `index.ts`

### Components
- **React Components**: `PascalCase` (e.g., `Header`, `StatCard`)
- **Props interfaces**: `ComponentNameProps` (e.g., `HeaderProps`)

### Variables & Functions
- **Variables**: `camelCase` (e.g., `projectsThisMonth`)
- **Functions**: `camelCase` (e.g., `getStatusStyles`)
- **Constants**: `SCREAMING_SNAKE_CASE` for env vars, `camelCase` for others

### Database
- **Tables**: `snake_case` plural (e.g., `projects`, `user_profiles`)
- **Columns**: `snake_case` (e.g., `created_at`, `project_id`)
- **Prisma models**: `PascalCase` singular (e.g., `Project`, `UserProfile`)

## Component Organization

### When to Create a Shared Component
Create a component in `src/components/` when:
1. Used in 2+ different pages
2. It's a fundamental UI element (button, input, card)
3. It's a layout element (header, footer, sidebar)

### When to Keep Components Local
Keep a component in the page file or folder when:
1. Only used in one place
2. Tightly coupled to page-specific logic
3. Unlikely to be reused

### Component File Structure
```tsx
// 1. Imports
import { useState } from "react";

// 2. Types (if small, otherwise separate file)
interface ButtonProps {
  variant: "primary" | "secondary";
  children: React.ReactNode;
}

// 3. Component
export function Button({ variant, children }: ButtonProps) {
  return <button className={...}>{children}</button>;
}
```

## Data Flow

### Server Components (Default)
- Pages and layouts are Server Components by default
- Fetch data directly in the component
- Use Prisma for database queries

```tsx
// src/app/projects/page.tsx
import { prisma } from "@/lib/prisma";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany();
  return <ProjectList projects={projects} />;
}
```

### Client Components
- Add `"use client"` directive when needed
- Use for interactivity (forms, modals, dropdowns)
- Keep as small as possible

### API Routes
- Use for mutations and external API calls
- Located in `src/app/api/`
- Keep business logic in separate functions

## Database (Prisma + Supabase)

### Schema Organization
```prisma
// Core entities first
model User { ... }
model Project { ... }

// Junction/relation tables last
model ProjectMember { ... }
```

### Migrations
```bash
# Create migration after schema changes
npx prisma migrate dev --name add_project_status

# Apply migrations in production
npx prisma migrate deploy
```

## Environment Variables

```bash
# .env.local (not committed)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
DATABASE_URL=...

# Use NEXT_PUBLIC_ prefix only for client-side variables
NEXT_PUBLIC_APP_URL=...
```

## Import Aliases

Use the `@/` alias for clean imports:
```tsx
import { Header } from "@/components/layout";
import { prisma } from "@/lib/prisma";
import type { Project } from "@/types";
```

## Adding New Features

1. **Create the page** in `src/app/feature-name/page.tsx`
2. **Add types** to `src/types/` if shared
3. **Create components** locally first, extract to `components/` if reused
4. **Add API routes** in `src/app/api/feature-name/route.ts` if needed
5. **Update Prisma schema** if new data models needed
