// src/components/ExpenseRow.tsx
'use client';

import { Trash2Icon } from 'lucide-react';
import type { ExpenseItem } from '@/utils/expenses';
import IngredientAutocomplete from '@/components/IngredientAutocomplete';
import type { IngredientOption } from '@/utils/ingredients';

export type ExpenseRowProps = {
  item: ExpenseItem;
  onChange: (id: number, field: 'ingredient' | 'ingredientId' | 'qty' | 'price', value: string) => void;
  onDelete: (id: number) => void;
  ingredients?: IngredientOption[];
  readOnly?: boolean;
};

export default function ExpenseRow({ item, onChange, onDelete, ingredients, readOnly = false }: ExpenseRowProps) {
  return (
    <div className="bg-white rounded-md border border-gray-100 p-3 shadow-sm">
      {/* Top line: Ingredient + Delete */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex-1 min-w-0">
          {readOnly ? (
            <div className="text-sm font-medium text-gray-800 truncate" title={item.ingredient || ''}>
              {(() => {
                if (item.ingredient && item.ingredient.trim() !== '') return item.ingredient;
                if (ingredients && item.ingredientId != null) {
                  const found = ingredients.find(opt => String(opt.id) === String(item.ingredientId));
                  return found?.name || '';
                }
                return '';
              })()}
            </div>
          ) : ingredients && ingredients.length > 0 ? (
            <IngredientAutocomplete
              value={item.ingredient}
              onChange={(val) => onChange(item.id, 'ingredient', val)}
              onSelect={(opt) => onChange(item.id, 'ingredientId', String(opt.id ?? ''))}
              options={ingredients}
              placeholder="Ingredient"
            />
          ) : (
            <input
              className="w-full text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
              placeholder="Ingredient"
              value={item.ingredient}
              onChange={(e) => {
                onChange(item.id, 'ingredient', e.target.value);
                // If user types manually, clear ingredientId to avoid stale mapping
                onChange(item.id, 'ingredientId', '');
              }}
            />
          )}
        </div>
        {!readOnly && (
          <button
            aria-label={`Delete item ${item.ingredient || ''}`}
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-md text-[#D32F2F] hover:bg-red-50 active:scale-[0.98]"
          >
            <Trash2Icon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom line: Qty | Price | Total */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-xs text-gray-500 mb-1">Qty</div>
          {readOnly ? (
            <div className="w-full text-sm text-center py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-md select-none">{(item.qty ?? 0).toString()}</div>
          ) : (
            <input
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              className="w-full text-sm text-center py-1 border border-gray-300 text-gray-900 rounded-md focus:ring-2 focus:ring-[#005A9C]/20 focus:outline-none"
              value={item.qty ?? ''}
              onChange={(e) => onChange(item.id, 'qty', e.target.value)}
            />
          )}
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Price</div>
          {readOnly ? (
            <div className="w-full text-sm text-center py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-md select-none">{(item.price ?? 0).toString()}</div>
          ) : (
            <input
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              className="w-full text-sm text-center py-1 border border-gray-300 text-gray-900 rounded-md focus:ring-2 focus:ring-[#005A9C]/20 focus:outline-none"
              value={item.price ?? ''}
              onChange={(e) => onChange(item.id, 'price', e.target.value)}
            />
          )}
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Total</div>
          <div className="w-full text-sm text-center py-1 font-semibold text-gray-800 select-none">{item.total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
