"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ModalType = "success" | "error" | "warning" | "info";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showConfirmButton?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const modalStyles = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    buttonColor: "bg-emerald-600 hover:bg-emerald-700",
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
    borderColor: "border-red-200",
    buttonColor: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200",
    buttonColor: "bg-amber-600 hover:bg-amber-700",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    borderColor: "border-blue-200",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
};

// Keep the modal in the DOM for 200ms after isOpen → false so the exit
// animation can play before the component unmounts.
const EXIT_DURATION = 180;

export default function Modal({
  isOpen,
  onClose,
  type,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  showConfirmButton = false,
  autoClose = false,
  autoCloseDelay = 3000,
}: ModalProps) {
  const style = modalStyles[type];
  const Icon = style.icon;

  // `mounted` keeps the DOM node alive during exit animation
  const [mounted, setMounted] = useState(false);
  // `visible` drives the CSS transition classes
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // One frame delay so the browser registers the initial state before
      // applying the visible classes (otherwise the transition doesn't play)
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), EXIT_DURATION);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Auto-close
  useEffect(() => {
    if (isOpen && autoClose) {
      const t = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(t);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!mounted) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${EXIT_DURATION}ms ease`,
        }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full max-w-md rounded-2xl bg-white shadow-2xl border-2 ${style.bgColor} ${style.borderColor}`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(8px)",
            transition: `opacity ${EXIT_DURATION}ms var(--ease-out), transform ${EXIT_DURATION}ms var(--ease-out)`,
            willChange: "transform, opacity",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-black/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>

          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-full ${style.bgColor}`}>
                <Icon className={`w-8 h-8 ${style.iconColor}`} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-center text-slate-900 mb-3">
              {title}
            </h3>
            <p className="text-center text-slate-600 mb-8 leading-relaxed">
              {message}
            </p>

            <div className="flex gap-3 justify-center">
              {showConfirmButton ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`px-6 py-2.5 text-white font-semibold rounded-xl shadow-lg ${style.buttonColor}`}
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className={`px-8 py-3 text-white font-semibold rounded-xl shadow-lg ${style.buttonColor}`}
                >
                  {confirmText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
