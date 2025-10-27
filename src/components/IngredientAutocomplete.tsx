// src/components/IngredientAutocomplete.tsx
'use client';

import { useMemo, useState } from 'react';
import { Combobox } from '@headlessui/react';
import type { IngredientOption } from '@/utils/ingredients';

export type IngredientAutocompleteProps = {
  value: string;
  onChange?: (val: string) => void;
  onSelect?: (opt: IngredientOption) => void;
  options: IngredientOption[];
  placeholder?: string;
};

export default function IngredientAutocomplete({ value, onChange, onSelect, options, placeholder = 'Ingredient' }: IngredientAutocompleteProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <Combobox value={value} onChange={(val: string | null) => {
      if (typeof val === 'string') {
        onChange?.(val);
        // If user selected an option (via click or keyboard), try to resolve and emit onSelect
        const found = options.find(o => o.name.toLowerCase() === val.toLowerCase());
        if (found) onSelect?.(found);
      }
    }}>
      <div className="relative">
        <Combobox.Input
          className="w-full text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none"
          displayValue={(v: string) => v}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
        />
        {filtered.length > 0 && (
          <Combobox.Options className="absolute mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
            {filtered.map((opt) => (
              <Combobox.Option
                key={(opt.id ?? opt.name).toString()}
                value={opt.name}
                onClick={() => onSelect?.(opt)}
                className={({ active }) => `cursor-pointer select-none px-3 py-2 ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`}
              >
                {opt.name}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
}
