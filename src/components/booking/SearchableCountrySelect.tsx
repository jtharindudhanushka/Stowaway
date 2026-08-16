'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface CountryOption {
  value: string; // e.g. "+94"
  label: string; // e.g. "Sri Lanka"
  code: string;  // e.g. "LK"
}

interface SearchableCountrySelectProps {
  id?: string;
  options: CountryOption[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function SearchableCountrySelect({
  id,
  options,
  value,
  onChange,
  className = '',
}: SearchableCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.value.includes(searchTerm) ||
    opt.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative ${className}`} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'w-full bg-slate-50 border text-left px-4 py-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer flex items-center justify-between gap-2',
          isOpen
            ? 'border-orange-600 bg-white ring-2 ring-orange-600/20'
            : 'border-slate-300 hover:border-slate-400',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-slate-900 truncate">
            {selectedOption ? `${selectedOption.code} (${selectedOption.value})` : 'Code'}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+6px)] w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] overflow-hidden flex flex-col animate-fade-in">
          <div className="p-2 border-b border-slate-100 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              className="w-full bg-slate-50 rounded-lg pl-9 pr-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-600/20 border border-slate-200 focus:border-orange-600"
              placeholder="Search country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={[
                      'w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors',
                      isSelected
                        ? 'bg-orange-50 text-orange-600 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium',
                    ].join(' ')}
                  >
                    <span className="truncate">{option.label} ({option.value})</span>
                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
