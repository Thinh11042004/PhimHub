import { useState, useCallback } from 'react';

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: (() => void) | null;
  type: 'danger' | 'warning' | 'info';
}

export function useConfirmModal() {
  const [modal, setModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xóa',
    cancelText: 'Hủy',
    onConfirm: null,
    type: 'danger'
  });

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
    }
  ) => {
    setModal({
      isOpen: true,
      title,
      message,
      confirmText: options?.confirmText || 'Xóa',
      cancelText: options?.cancelText || 'Hủy',
      onConfirm,
      type: options?.type || 'danger'
    });
  }, []);

  const hideModal = useCallback(() => {
    setModal(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    hideModal();
  }, [modal.onConfirm, hideModal]);

  return {
    modal,
    showConfirm,
    hideModal,
    handleConfirm
  };
}
