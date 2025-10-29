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
  // Khóa body scroll khi mở modal
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* khung modal */}
      <div
        className={`relative mx-4 my-8 w-full ${maxWidthClass}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="rounded-2xl bg-[#1f2d3b] ring-1 ring-white/10 shadow-xl">
          {/* header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
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
          <div className="max-h-[80vh] overflow-y-auto px-4 py-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
