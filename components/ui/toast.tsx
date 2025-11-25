'use client';

import { useToastStore } from '@/lib/store';
import { X, CheckCircle, XCircle, Info } from 'lucide-react';

export function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slideUp
            ${toast.type === 'success' ? 'bg-success/20 border border-success/30' : ''}
            ${toast.type === 'error' ? 'bg-destructive/20 border border-destructive/30' : ''}
            ${toast.type === 'info' ? 'bg-primary/20 border border-primary/30' : ''}
          `}
        >
          {toast.type === 'success' && (
            <CheckCircle className="w-5 h-5 text-success" />
          )}
          {toast.type === 'error' && (
            <XCircle className="w-5 h-5 text-destructive" />
          )}
          {toast.type === 'info' && <Info className="w-5 h-5 text-primary" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 p-1 hover:bg-white/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
