'use client';

import Header from '@/components/Header';
import { useEffect, useMemo, useState } from 'react';
import { DailyPrediction, getMonthlyPrediction, formatCurrencyBDT, monthName } from '@/utils/predictions';
import ToastBanner from '@/components/ToastBanner';

export default function PredictionsPage() {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ total: number; days: DailyPrediction[] }>({ total: 0, days: [] });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await getMonthlyPrediction(year, month);
        if (!mounted) return;
        setData({ total: resp.total_predicted_expense, days: resp.daily_predictions || [] });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        setError(msg);
        setData({ total: 0, days: [] });
      } finally {
        setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [year, month]);

  const maxVal = useMemo(() => data.days.reduce((m, d) => Math.max(m, d.predicted_expense || 0), 0), [data.days]);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-gray-50">
        <Header title="Monthly Predictions" />

        {/* Controls */}
        <div className="sticky top-16 z-10 bg-white border-b border-gray-100 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-400 bg-gray-50 text-gray-800 placeholder-gray-500 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{monthName(m)}</option>
              ))}
            </select>
            <input
              type="number"
              className="w-24 border border-gray-400 bg-gray-50 text-gray-800 placeholder-gray-500 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-lg font-bold text-emerald-700">{formatCurrencyBDT(data.total)}</div>
          </div>
        </div>

        {/* List */}
        <main className="p-3 pb-24">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border rounded-md p-3">
                  <div className="h-4 bg-gray-200 w-1/2 mb-2 rounded" />
                  <div className="h-3 bg-gray-100 w-2/3 rounded" />
                </div>
              ))}
            </div>
          ) : data.days.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-xl shadow-sm mt-2 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-700 mb-1">No data</h4>
              <p className="text-sm text-gray-500">Try another month.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.days.map((d) => {
                const pct = maxVal > 0 ? Math.round((d.predicted_expense / maxVal) * 100) : 0;
                const dateLabel = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                return (
                  <div key={d.date} className="bg-white border rounded-md p-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="font-medium text-gray-800">{dateLabel}</div>
                      <div className="font-semibold text-gray-900">{formatCurrencyBDT(d.predicted_expense)}</div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded">
                      <div className="h-2 bg-blue-600 rounded" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {error && (
          <ToastBanner message={error} type="error" onClose={() => setError(null)} />
        )}
      </div>
    </div>
  );
}
