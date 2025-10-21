import { createContext, useContext, ReactNode } from 'react';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { ConfirmModal } from './ConfirmModal';

interface ConfirmModalContextType {
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
    }
  ) => void;
}

const ConfirmModalContext = createContext<ConfirmModalContextType | null>(null);

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const { modal, showConfirm, hideModal, handleConfirm } = useConfirmModal();

  return (
    <ConfirmModalContext.Provider value={{ showConfirm }}>
      {children}
      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={handleConfirm}
        onCancel={hideModal}
        type={modal.type}
      />
    </ConfirmModalContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmModalProvider');
  }
  return context;
}
