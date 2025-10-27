// src/utils/predictions.ts

export type DailyPrediction = {
  date: string; // YYYY-MM-DD
  predicted_expense: number;
};

export type MonthlyPrediction = {
  year: number;
  month: number; // 1-12 or 10 in provided sample
  total_predicted_expense: number;
  daily_predictions: DailyPrediction[];
};

export async function getMonthlyPrediction(year: number, month: number): Promise<MonthlyPrediction> {
  const res = await fetch(`/api/predictions/month?year=${year}&month=${month}`, { cache: 'no-store' });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Prediction fetch failed: ${res.status} ${t.slice(0, 120)}`);
  }
  return res.json();
}

export function formatCurrencyBDT(n: number): string {
  if (!isFinite(n)) return '৳0';
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 2 }).format(n);
}

export function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString(undefined, { month: 'long' });
}
