"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-100",
    error: "bg-red-50 border-red-100",
    info: "bg-blue-50 border-blue-100",
  };

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-xl animate-in slide-in-from-right-10 duration-300 min-w-[300px] max-w-[450px]",
      bgColors[type]
    )}>
      <div className="shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-bold text-slate-800 leading-tight">{message}</p>
      <button 
        onClick={onClose}
        className="shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Hook to manage toasts
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return { toast, showToast, hideToast };
}
