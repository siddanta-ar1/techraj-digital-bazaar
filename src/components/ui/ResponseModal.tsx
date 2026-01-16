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

export default function ResponseModal({
  isOpen,
  onClose,
  type,
  title,
  message,
}: ResponseModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300); // Animation delay
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-12 h-12 text-emerald-500" />;
      case "error":
        return <XCircle className="w-12 h-12 text-rose-500" />;
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-amber-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return "bg-emerald-50 border-emerald-100 text-emerald-900";
      case "error":
        return "bg-rose-50 border-rose-100 text-rose-900";
      case "warning":
        return "bg-amber-50 border-amber-100 text-amber-900";
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform transition-all duration-300 ${
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={`p-4 rounded-full mb-4 ${type === "success" ? "bg-emerald-100" : type === "error" ? "bg-rose-100" : "bg-amber-100"}`}
          >
            {getIcon()}
          </div>

          <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>

          <div
            className={`w-full p-3 rounded-xl border text-sm font-medium ${getColors()}`}
          >
            {message}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-transform active:scale-95"
          >
            Okay, Got it
          </button>
        </div>
      </div>
    </div>
  );
}
