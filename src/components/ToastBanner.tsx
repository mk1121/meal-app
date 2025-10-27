// src/components/ToastBanner.tsx
"use client";

import { CheckCircle, Info, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export default function ToastBanner({
  message,
  type = 'info',
  onClose,
  autoHideMs = 3000,
}: {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  autoHideMs?: number;
}) {
  useEffect(() => {
    if (!autoHideMs) return;
    const t = setTimeout(() => onClose?.(), autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs, onClose]);

  const color =
    type === 'success' ? 'bg-green-600 text-white' :
    type === 'error' ? 'bg-red-600 text-white' :
    'bg-blue-600 text-white';

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : Info;

  return (
    <div className="fixed inset-x-0 bottom-5 z-40 pointer-events-none">
      <div className="w-full max-w-md mx-auto px-4">
        <div className={`pointer-events-auto ${color} rounded-lg shadow-lg border border-black/10 flex items-center gap-2 px-3 py-2`}>
          <Icon className="w-5 h-5" />
          <div className="flex-1 text-sm font-medium">{message}</div>
          {onClose && (
            <button
              aria-label="Close toast"
              className="p-1/2 hover:opacity-80 transition-opacity"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
