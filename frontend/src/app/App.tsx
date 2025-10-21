import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import PublicLayout from "./layouts/PublicLayout";
import TokenSetter from "../components/TokenSetter";
import { ConfirmModalProvider } from "../shared/components/ConfirmModalProvider";

export default function App() {
  return (
    <ConfirmModalProvider>
      <TokenSetter />
      <PublicLayout>
        <Suspense fallback={<div className="p-4">Đang tải…</div>}>
          <Outlet />
        </Suspense>
      </PublicLayout>
    </ConfirmModalProvider>
  );
}
