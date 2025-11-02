// src/shared/components/Modal.tsx
import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidthClass?: string; // ví dụ: "max-w-3xl"
  children: React.ReactNode;
};

export default function Modal({
  open,
  onClose,
  title,
  maxWidthClass = "max-w-3xl",
  children,
}: ModalProps) {
  // Không khóa body scroll để có thể cuộn modal và xem nội dung phía sau
  // Người dùng có thể cuộn modal và vẫn thấy được phần nào nội dung phía sau

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* khung modal */}
      <div
        className={`relative z-10 mx-auto my-8 w-full ${maxWidthClass}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl bg-[#1f2d3b] ring-1 ring-white/10 shadow-xl">
          {/* header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#1f2d3b] px-4 py-3">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-md px-2 py-1 text-white/80 hover:bg-white/10"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {/* NỘI DUNG CUỘN ĐƯỢC */}
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
