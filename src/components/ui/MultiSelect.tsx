"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function MultiSelect({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  required,
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeValue = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const getLabel = (optionValue: string) => {
    const option = options.find((o) => o.value === optionValue);
    return option?.label || optionValue;
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-zinc-300">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full rounded-lg border bg-zinc-900/50 px-4 py-3 text-left text-sm
            transition-all focus:bg-zinc-900 focus:outline-none focus:ring-2
            ${error
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
              : "border-zinc-800 focus:border-zinc-700 focus:ring-green-500/20"
            }
            ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          `}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 flex-1 min-h-[24px]">
              {value.length > 0 ? (
                value.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400"
                  >
                    {getLabel(v)}
                    {!disabled && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => removeValue(v, e)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            removeValue(v, e as unknown as React.MouseEvent);
                          }
                        }}
                        className="hover:text-green-200 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-zinc-500">{placeholder}</span>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg">
            <div className="max-h-60 overflow-auto py-1">
              {options.length === 0 ? (
                <div className="px-4 py-2 text-sm text-zinc-500">
                  Nenhuma opção disponível
                </div>
              ) : (
                options.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleOption(option.value)}
                      className={`
                        flex w-full items-center gap-2 px-4 py-2 text-left text-sm
                        transition-colors hover:bg-zinc-800
                        ${isSelected ? "text-green-400" : "text-zinc-300"}
                      `}
                    >
                      <div
                        className={`
                          flex h-4 w-4 items-center justify-center rounded border
                          ${isSelected
                            ? "border-green-500 bg-green-500"
                            : "border-zinc-600 bg-transparent"
                          }
                        `}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      {option.label}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
