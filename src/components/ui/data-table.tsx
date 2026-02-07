"use client";

import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  actions?: ReactNode;
  pagination?: {
    showing: number;
    total: number;
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
  };
  rowAction?: (item: T) => ReactNode;
}

export function DataTable<T>({
  title,
  columns,
  data,
  keyExtractor,
  actions,
  pagination,
  rowAction,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 ${
                    column.align === "right"
                      ? "text-right"
                      : column.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {column.header}
                </th>
              ))}
              {rowAction && (
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="group transition-colors hover:bg-zinc-800/30"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`whitespace-nowrap px-6 py-4 ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {column.render
                      ? column.render(item)
                      : String((item as Record<string, unknown>)[column.key] ?? "")}
                  </td>
                ))}
                {rowAction && (
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    {rowAction(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <p className="text-sm text-zinc-500">
            Mostrando{" "}
            <span className="font-medium text-zinc-300">{pagination.showing}</span>{" "}
            de <span className="font-medium text-zinc-300">{pagination.total}</span>{" "}
            projetos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={pagination.onPrevious}
              disabled={pagination.hasPrevious === false}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={pagination.onNext}
              disabled={pagination.hasNext === false}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
