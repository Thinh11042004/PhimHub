import { useEffect, useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Xóa',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  type = 'danger'
}: ConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    setIsVisible(false);
    setTimeout(() => onConfirm(), 200);
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(() => onCancel(), 200);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
          iconColor: 'text-red-500',
          iconBg: 'bg-red-100',
          confirmBg: 'bg-red-500 hover:bg-red-600',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
          iconColor: 'text-yellow-500',
          iconBg: 'bg-yellow-100',
          confirmBg: 'bg-yellow-500 hover:bg-yellow-600',
          border: 'border-yellow-200'
        };
      default:
        return {
          icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-100',
          confirmBg: 'bg-blue-500 hover:bg-blue-600',
          border: 'border-blue-200'
        };
    }
  };

  const styles = getTypeStyles();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full mx-4
          transform transition-all duration-200 ease-out
          ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-700">
          <div className={`w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
            <svg className={`w-6 h-6 ${styles.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={styles.icon} />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 text-white ${styles.confirmBg} rounded-lg transition-colors duration-200 font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
