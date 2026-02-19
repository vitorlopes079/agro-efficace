"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface ProjectUserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function ProjectUserCard({ user }: ProjectUserCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base">Criado por</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
