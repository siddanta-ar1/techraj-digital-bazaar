"use client";

import { useState, useCallback } from "react";

type ModalType = "success" | "error" | "warning" | "info";

interface ModalState {
  isOpen: boolean;
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

const initialState: ModalState = {
  isOpen: false,
  type: "info",
  title: "",
  message: "",
  confirmText: "OK",
  cancelText: "Cancel",
  showConfirmButton: false,
  autoClose: false,
  autoCloseDelay: 3000,
};

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>(initialState);

  const openModal = useCallback((config: Partial<ModalState>) => {
    setModalState({
      ...initialState,
      ...config,
      isOpen: true,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(initialState);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title: string, message: string, autoClose = true) => {
    openModal({
      type: "success",
      title,
      message,
      autoClose,
      autoCloseDelay: 3000,
    });
  }, [openModal]);

  const showError = useCallback((title: string, message: string) => {
    openModal({
      type: "error",
      title,
      message,
      autoClose: false,
    });
  }, [openModal]);

  const showWarning = useCallback((title: string, message: string) => {
    openModal({
      type: "warning",
      title,
      message,
      autoClose: false,
    });
  }, [openModal]);

  const showInfo = useCallback((title: string, message: string) => {
    openModal({
      type: "info",
      title,
      message,
      autoClose: false,
    });
  }, [openModal]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    openModal({
      type: "warning",
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      showConfirmButton: true,
      autoClose: false,
    });
  }, [openModal]);

  return {
    modalState,
    openModal,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
}
