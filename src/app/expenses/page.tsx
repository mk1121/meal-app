'use client';

import Header from '@/components/Header';
import ExpenseRow from '@/components/ExpenseRow';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency, formatDateForInput, formatHumanLabel, ExpenseItem, createEmptyExpense, computeRowTotal, computeTotalCost, formatDateForAPI, getExpensesForDate } from '@/utils/expenses';
import { CalendarIcon } from 'lucide-react';
import { getIngredients, type IngredientOption } from '@/utils/ingredients';

export default function DailyExpensesPage() {
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const idCounterRef = useRef<number>(1);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);

  const totalCost = useMemo(() => computeTotalCost(items), [items]);

  // Hidden date input handling (open below icon)
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const openDatePicker = useCallback(() => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      const picker = el as unknown as { showPicker?: () => void };
      if (typeof picker.showPicker === 'function') {
        picker.showPicker();
      } else {
        el.focus();
        el.click();
      }
    } catch {
      el.focus();
      el.click();
    }
  }, []);

  // Load ingredient list once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getIngredients();
        if (mounted) setIngredients(list);
      } catch (e) {
        console.error('Failed to load ingredients', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load expenses for current date on mount and when date changes via handler
  const loadForDate = useCallback(async (d: Date) => {
    setIsLoading(true);
    try {
      const loaded = await getExpensesForDate(d);
      setItems(loaded);
    } catch (e) {
      console.error('Failed to load expenses', e);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadForDate(dateObj);
  }, [loadForDate, dateObj]);

  // If ingredients arrive, always normalize ingredient names from the master list using ingredientId
  useEffect(() => {
    if (!ingredients || ingredients.length === 0) return;
    setItems(prev => {
      const map = new Map<string, string>(ingredients
        .filter(i => i.id !== undefined && i.id !== null)
        .map(i => [String(i.id as unknown as string), i.name])
      );
      let changed = false;
      const next = prev.map(it => {
        if (it.ingredientId != null) {
          const name = map.get(String(it.ingredientId));
          if (name && name !== it.ingredient) {
            changed = true;
            return { ...it, ingredient: name };
          }
        }
        return it;
      });
      return changed ? next : prev;
    });
  }, [ingredients]);

  const handleChange = (id: number, field: 'ingredient' | 'ingredientId' | 'qty' | 'price', raw: string) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      if (field === 'ingredient') {
        return { ...it, ingredient: raw };
      }
      if (field === 'ingredientId') {
        const parsed = raw.trim() === '' ? null : Number(raw);
        return { ...it, ingredientId: isNaN(parsed as number) ? null : parsed };
      }
      const num = raw.replace(',', '.');
      const val = num === '' ? null : Number(num);
      if (field === 'qty') {
        const total = computeRowTotal(val, it.price);
        return { ...it, qty: isNaN(val as number) ? null : val, total };
      }
      if (field === 'price') {
        const total = computeRowTotal(it.qty, val);
        return { ...it, price: isNaN(val as number) ? null : val, total };
      }
      return it;
    }));
  };

  const handleDelete = (id: number) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleAddItem = () => {
    const id = idCounterRef.current++;
    setItems(prev => [createEmptyExpense(id), ...prev]);
  };

  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const expense_date = formatDateForAPI(dateObj);
      const payload = items
        // skip persisted (loaded) rows to avoid updates, per requirement
        .filter(it => !it.persisted)
        .map(it => {
          const qty = typeof it.qty === 'number' && !isNaN(it.qty) ? it.qty : null;
          const price = typeof it.price === 'number' && !isNaN(it.price) ? it.price : null;
          const ingredient_id = typeof it.ingredientId === 'number' && isFinite(it.ingredientId)
            ? it.ingredientId
            : null;
          if (ingredient_id == null || qty == null || price == null) return null;
          const row: Record<string, unknown> = {
            expense_date,
            ingredient_id,
            quantity: qty,
            unit_price: price,
          };
          // If you later load existing rows with persistent IDs, include:
          // if ((it as any).expenseId) row.expense_id = (it as any).expenseId;
          return row;
        })
        .filter(Boolean);

      if (payload.length === 0) {
        alert('Nothing to save. Please fill ingredient, quantity and price.');
        return;
      }

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.body || data?.error || 'Save failed');
      alert(data?.message || 'Saved successfully.');
    } catch (e) {
      console.error(e);
      alert('Save failed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-gray-50">
        <Header title="Daily Expenses" />

  {/* Sticky Summary Bar (stay below header) */}
  <div className="sticky top-16 z-10 bg-white border-b border-gray-100 px-3 py-2 flex items-center justify-between">
          <div
            className="flex items-center gap-2 px-2 py-1 border border-gray-200 rounded-md text-sm cursor-pointer select-none relative"
            role="button"
            tabIndex={0}
            onClick={openDatePicker}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDatePicker(); } }}
          >
            <CalendarIcon className="w-4 h-4 text-blue-700" />
            <span className="text-gray-800">{formatHumanLabel(dateObj)}</span>
            <input
              ref={dateInputRef}
              type="date"
              className="absolute right-0 top-full mt-2 opacity-0 h-8 w-28 pointer-events-none"
              value={formatDateForInput(dateObj)}
              onChange={(e) => {
                const v = e.target.value; // yyyy-mm-dd
                if (!v) return;
                const [yy, mm, dd] = v.split('-').map(Number);
                const chosen = new Date(yy, (mm || 1) - 1, dd || 1);
                setDateObj(chosen);
                loadForDate(chosen);
              }}
            />
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-lg font-bold" style={{ color: '#2E7D32' }}>{formatCurrency(totalCost)}</div>
          </div>
        </div>

        {/* Main content */}
        <main className="p-3 space-y-3 pb-28">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-md border p-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-8 bg-gray-100 rounded"></div>
                    <div className="h-8 bg-gray-100 rounded"></div>
                    <div className="h-8 bg-gray-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-xl shadow-sm mt-2 border border-gray-200">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 mx-auto mb-3 flex items-center justify-center">ℹ️</div>
              <h4 className="text-lg font-semibold text-gray-700 mb-1">No expenses yet for this date</h4>
              <p className="text-sm text-gray-500 mb-4">Start by adding your first item.</p>
              <button onClick={handleAddItem} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Add Your First Item</button>
            </div>
          ) : (
            items.map(item => (
              <ExpenseRow
                key={item.id}
                item={item}
                onChange={handleChange}
                onDelete={handleDelete}
                ingredients={ingredients}
                readOnly={Boolean(item.persisted)}
              />
            ))
          )}
        </main>

        {/* Bottom fixed actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="w-full max-w-md mx-auto flex items-center gap-3">
            <button onClick={handleAddItem} className="flex-1 border border-gray-300 text-sm rounded-lg py-2 text-gray-700">Add Item</button>
            <button onClick={handleSaveAll} disabled={isSaving} className="flex-1 bg-[#005A9C] disabled:opacity-60 text-white text-sm rounded-lg py-2 font-semibold">
              {isSaving ? 'Saving…' : 'Save All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
