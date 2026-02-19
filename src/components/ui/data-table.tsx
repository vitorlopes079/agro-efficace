"use client";

import { ReactNode } from "react";

function generatePageNumbers(
  currentPage: number,
  totalPages: number
): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  if (currentPage <= 3) {
    pages.push(1, 2, 3, 4, "...", totalPages);
  } else if (currentPage >= totalPages - 2) {
    pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
  }

  return pages;
}

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
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  rowAction?: (item: T) => ReactNode;
  onRowClick?: (item: T) => void;
  /** Custom mobile card renderer - if provided, shows cards on mobile instead of table */
  mobileRender?: (item: T, action?: ReactNode) => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  pagination,
  rowAction,
  onRowClick,
  mobileRender,
}: DataTableProps<T>) {
  // Pagination component (shared between mobile and desktop)
  const PaginationControls = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-center text-xs text-zinc-500 sm:text-left sm:text-sm">
          Página{" "}
          <span className="font-medium text-zinc-300">{pagination.page}</span>{" "}
          de{" "}
          <span className="font-medium text-zinc-300">{pagination.totalPages}</span>{" "}
          ({pagination.total} itens)
        </p>
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="rounded-lg border border-zinc-700 px-2 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
          >
            Anterior
          </button>
          <div className="hidden sm:flex sm:items-center sm:gap-1">
            {generatePageNumbers(pagination.page, pagination.totalPages).map(
              (pageNum, index) =>
                pageNum === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-xs text-zinc-500"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum as number)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                      pagination.page === pageNum
                        ? "bg-emerald-600 text-white"
                        : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
            )}
          </div>
          <span className="px-2 text-xs text-zinc-400 sm:hidden">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded-lg border border-zinc-700 px-2 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
          >
            Próximo
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      {/* Mobile Card View */}
      {mobileRender && (
        <div className="divide-y divide-zinc-800/50 md:hidden">
          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? "cursor-pointer" : ""}
            >
              {mobileRender(item, rowAction?.(item))}
            </div>
          ))}
        </div>
      )}

      {/* Desktop Table View */}
      <div className={mobileRender ? "hidden md:block" : ""}>
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
                  onClick={() => onRowClick?.(item)}
                  className={`group transition-colors hover:bg-zinc-800/30 ${onRowClick ? "cursor-pointer" : ""}`}
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
      </div>

      <PaginationControls />
    </div>
  );
}
