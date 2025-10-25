import { ReactNode } from "react";
import Navbar from "@shared/components/Navbar";
import AuthModal from "@shared/components/AuthModal";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    
    <div className="min-h-screen bg-[#000011] text-white">
      <Navbar />
      <main className="w-full px-2 md:px-3 pb-16">{children}</main>
      <AuthModal />
      <footer className="mt-10 border-t border-white/10 bg-white/5">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-white/70">
          <div className="flex flex-wrap gap-4">
            <a className="hover:text-white/90" href="#">Liên hệ</a>
            <a className="hover:text-white/90" href="#">Điều khoản</a>
            <a className="hover:text-white/90" href="#">Chính sách</a>
          </div>
          <p className="mt-2">© {new Date().getFullYear()} PhimHub · For study/demo only.</p>
        </div>
      </footer>
    </div>
  );
}
