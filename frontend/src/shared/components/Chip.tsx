export default function Chip({ children }: { children: React.ReactNode }) {
  return (
    <button className="rounded-xl bg-white/10 px-4 py-3 text-sm shadow hover:bg-white/15 active:scale-[.99]">
      {children}
    </button>
  );
}
