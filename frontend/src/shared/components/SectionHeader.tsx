export default function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button className="text-sm text-white/70 hover:text-white/90">Xem tất cả →</button>
    </div>
  );
}
