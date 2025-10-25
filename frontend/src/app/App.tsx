import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import PublicLayout from "./layouts/PublicLayout";
import TokenSetter from "../components/TokenSetter";

export default function App() {
  return (
    <>
      <TokenSetter />
      <PublicLayout>
        <Suspense fallback={<div className="p-4">Đang tải…</div>}>
          <Outlet />
        </Suspense>
      </PublicLayout>
    </>
  );
}
