"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectChangeEvent {
  target: {
    name: string;
    value: string;
  };
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  onChange?: (e: SelectChangeEvent) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

export function Select({
  label,
  error,
  options,
  placeholder = "Selecione...",
  value,
  onChange,
  name = "",
  required,
  disabled = false,
}: SelectProps) {
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

  const handleSelect = (optionValue: string) => {
    if (onChange) {
      onChange({ target: { name, value: optionValue } });
    }
    setIsOpen(false);
  };

  const selectedOption = options.find((o) => o.value === value);

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
            <span className={selectedOption ? "text-white" : "text-zinc-500"}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
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
                  const isSelected = value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`
                        w-full px-4 py-2 text-left text-sm transition-colors
                        ${isSelected
                          ? "bg-green-500/20 text-green-400"
                          : "text-zinc-300 hover:bg-zinc-800"
                        }
                      `}
                    >
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
