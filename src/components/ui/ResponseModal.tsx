"use client";

import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error" | "warning";
  title: string;
  message: string;
}

const EXIT_DURATION = 180;

export default function ResponseModal({
  isOpen,
  onClose,
  type,
  title,
  message,
}: ResponseModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), EXIT_DURATION);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const icons = {
    success: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
    error:   <XCircle      className="w-12 h-12 text-rose-500" />,
    warning: <AlertTriangle className="w-12 h-12 text-amber-500" />,
  };

  const iconBg  = { success: "bg-emerald-100", error: "bg-rose-100",  warning: "bg-amber-100"  };
  const msgStyle = {
    success: "bg-emerald-50 border-emerald-100 text-emerald-900",
    error:   "bg-rose-50 border-rose-100 text-rose-900",
    warning: "bg-amber-50 border-amber-100 text-amber-900",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${EXIT_DURATION}ms ease`,
        }}
        onClick={onClose}
      />

      {/* Card — exits upward (scale + slide up), enters from slight below */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(-8px)",
          transition: `opacity ${EXIT_DURATION}ms var(--ease-out), transform ${EXIT_DURATION}ms var(--ease-out)`,
          willChange: "transform, opacity",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-full mb-4 ${iconBg[type]}`}>
            {icons[type]}
          </div>

          <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>

          <div className={`w-full p-3 rounded-xl border text-sm font-medium ${msgStyle[type]}`}>
            {message}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
