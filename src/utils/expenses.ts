// src/utils/expenses.ts

export type ExpenseItem = {
  id: number;
  ingredient: string;
  ingredientId?: number | null;
  qty: number | null;
  price: number | null;
  total: number; // derived = (qty || 0) * (price || 0)
  persisted?: boolean; // true if loaded from API (view-only)
};

export const createEmptyExpense = (id: number): ExpenseItem => ({
  id,
  ingredient: '',
  qty: null,
  price: null,
  total: 0,
  persisted: false,
});

export const computeRowTotal = (qty: number | null, price: number | null): number => {
  const q = typeof qty === 'number' && !isNaN(qty) ? qty : 0;
  const p = typeof price === 'number' && !isNaN(price) ? price : 0;
  return Number((q * p).toFixed(2));
};

export const computeTotalCost = (items: ExpenseItem[]): number => {
  return Number(items.reduce((acc, it) => acc + (it.total || 0), 0).toFixed(2));
};

export const formatCurrency = (n: number): string => {
  if (!isFinite(n)) return '$0.00';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
};

export const formatHumanLabel = (date: Date): string => {
  const today = new Date();
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (isSameDay) {
    return `Today, ${today.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateForInput = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// For API payload (MM/DD/YYYY)
export const formatDateForAPI = (date: Date): string => {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
};

// ---- API mapping for GET /NTS/expense?date=MM/DD/YYYY ----

const pickNumber = (obj: Record<string, unknown>, keys: string[]): number | null => {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v);
  }
  return null;
};

const pickIngredientName = (obj: Record<string, unknown>): string => {
  const candidates = [
    'ingredient_name', 'INGREDIENT_NAME',
    'ingredient', 'INGREDIENT',
    'ing_name', 'ING_NAME',
    'description', 'DESCRIPTION',
    'name', 'NAME',
    'title', 'TITLE',
  ];
  for (const k of candidates) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
};

export const parseExpensesFromApi = (data: unknown): ExpenseItem[] => {
  if (!data || typeof data !== 'object') return [];
  const root = data as Record<string, unknown>;
  const arr = Array.isArray(root.items) ? (root.items as unknown[]) : (Array.isArray(data) ? (data as unknown[]) : []);
  let nextId = 1;
  return arr.map((raw) => {
    const obj = (raw || {}) as Record<string, unknown>;
    const ingredientId = pickNumber(obj, [
      'ingredient_id', 'INGREDIENT_ID',
      'ingredientid', 'INGREDIENTID',
      'ing_id', 'ING_ID',
      'ingcode', 'INGCODE', 'ing_code', 'ING_CODE',
      'code', 'CODE'
    ]);
    const qty = pickNumber(obj, ['quantity', 'qty', 'QUANTITY']);
    const price = pickNumber(obj, ['unit_price', 'price', 'UNIT_PRICE']);
    const total = computeRowTotal(qty, price);
    const ingredient = pickIngredientName(obj);
    const expenseId = pickNumber(obj, ['expense_id', 'EXPENSE_ID']);
    const id = expenseId ?? pickNumber(obj, ['id', 'ID']) ?? nextId++;
    return {
      id,
      ingredient,
      ingredientId,
      qty,
      price,
      total,
      // এই ফাংশনটি শুধুই GET ডাটা পার্স করার জন্য, তাই সব রেকর্ডকেই persisted (read-only) ধরা হবে
      persisted: true,
    } as ExpenseItem;
  });
};

export const getExpensesForDate = async (date: Date): Promise<ExpenseItem[]> => {
  const dateStr = formatDateForAPI(date);
  // Use raw slashes in query (no %2F) as upstream expects unencoded date
  const res = await fetch(`/api/expenses?date=${dateStr}`, { cache: 'no-store' });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Expenses fetch failed: ${res.status} ${t.slice(0, 160)}`);
  }
  const json = await res.json();
  return parseExpensesFromApi(json);
};
