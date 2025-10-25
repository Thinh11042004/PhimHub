import React from "react";

type Props = {
  onClick?: () => void;
  title?: string;
  variant?: "inline" | "fab"; // inline = nút nhỏ; fab = nút nổi góc phải dưới
};

export default function EditButton({ onClick, title = "Chỉnh sửa", variant = "inline" }: Props) {
  if (variant === "fab") {
    return (
      <button
        onClick={onClick}
        title={title}
        className="fixed bottom-6 right-6 z-[90] flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-3 font-medium text-slate-900 shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 focus:outline-none"
      >
        <span>✎</span> <span>Chỉnh sửa</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
    >
      <span>✎</span>
      <span>{title}</span>
    </button>
  );
}
    