'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  id?: string;
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  minDropdownWidth?: string;
}

export function CustomSelect({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  icon,
  className = '',
  minDropdownWidth,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'w-full bg-white border text-left px-3.5 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs',
          isOpen
            ? 'border-orange-600 ring-2 ring-orange-600/20'
            : 'border-slate-300 hover:border-slate-400',
        ].join(' ')}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && <span className="text-orange-600 flex-shrink-0">{icon}</span>}
          <span className={`truncate ${selectedOption ? 'text-slate-900 font-bold' : 'text-slate-400 font-normal'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-orange-600' : ''
          }`}
        />
      </button>

      {/* Custom Dropdown Popover (Width handles wide country names cleanly) */}
      {isOpen && (
        <div
          style={{ minWidth: minDropdownWidth || '100%' }}
          className="absolute left-0 top-[calc(100%+6px)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] py-2 max-h-64 overflow-y-auto animate-fade-in"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={[
                  'w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-3 transition-colors cursor-pointer whitespace-nowrap',
                  isSelected
                    ? 'bg-orange-50 text-orange-600 font-bold'
                    : 'text-slate-800 hover:bg-slate-50 font-semibold',
                ].join(' ')}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate">{option.label}</p>
                  {option.sublabel && (
                    <p className="text-xs text-slate-400 font-normal truncate mt-0.5">{option.sublabel}</p>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
