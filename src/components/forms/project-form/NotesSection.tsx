import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

interface NotesSectionProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export function NotesSection({ value, onChange, disabled = false }: NotesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Observações</CardTitle>
      </CardHeader>
      <CardContent>
        <textarea
          name="notes"
          value={value}
          onChange={onChange}
          rows={4}
          placeholder="Informações adicionais sobre o projeto..."
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
