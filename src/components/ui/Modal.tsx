"use client";

import { useEffect } from "react";
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

  // Auto close functionality
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full max-w-md transform rounded-2xl bg-white shadow-2xl transition-all ${style.bgColor} ${style.borderColor} border-2`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className={`p-4 rounded-full ${style.bgColor}`}>
                <Icon className={`w-8 h-8 ${style.iconColor}`} />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center text-slate-900 mb-4">
              {title}
            </h3>

            {/* Message */}
            <p className="text-center text-slate-600 mb-8 leading-relaxed">
              {message}
            </p>

            {/* Action buttons */}
            <div className="flex gap-3 justify-center">
              {showConfirmButton ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-slate-600 hover:text-slate-800 font-medium rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`px-6 py-2.5 text-white font-semibold rounded-xl transition-colors shadow-lg ${style.buttonColor}`}
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className={`px-8 py-3 text-white font-semibold rounded-xl transition-colors shadow-lg ${style.buttonColor}`}
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
