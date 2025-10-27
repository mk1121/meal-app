// src/utils/ingredients.ts

export type IngredientOption = {
  id?: string | number;
  name: string;
};

// Attempt to pick a string from multiple possible keys
const pickString = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return undefined;
};

const pickId = (obj: Record<string, unknown>): string | number | undefined => {
  const candidates = ['ingredient_id', 'id', 'INGREDIENT_ID', 'ID', 'code', 'CODE'];
  for (const k of candidates) {
    const v = obj[k];
    if (typeof v === 'string' || typeof v === 'number') return v;
  }
  return undefined;
};

export const parseIngredientOptions = (data: unknown): IngredientOption[] => {
  if (!data || typeof data !== 'object') return [];
  const root = data as Record<string, unknown>;
  const list = Array.isArray(root.items) ? root.items : Array.isArray(data) ? (data as unknown[]) : [];
  return list
    .map((raw) => {
      const obj = (raw || {}) as Record<string, unknown>;
      const name =
        pickString(obj, ['name', 'ingredient_name', 'INGREDIENT_NAME', 'description', 'DESCRIPTION', 'title', 'TITLE']) ||
        '';
      const id = pickId(obj);
      return name ? { id, name } : null;
    })
    .filter(Boolean) as IngredientOption[];
};

export const getIngredients = async (): Promise<IngredientOption[]> => {
  const res = await fetch('/api/ingredients', { cache: 'no-store' });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ingredients fetch failed: ${res.status} ${t.slice(0, 120)}`);
  }
  const json = await res.json();
  return parseIngredientOptions(json);
};
