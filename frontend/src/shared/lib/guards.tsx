// src/shared/lib/guards.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../store/auth";

export function RequireAuth() {
  const { user, hydrate } = useAuth();
  if (!user) hydrate();
  return user ? <Outlet /> : <Navigate to="/" replace />;
}

export function RequireRole({ role }: { role: "admin" | "user" }) {
  const { user, hydrate } = useAuth();
  if (!user) hydrate();
  return user && user.role === role ? <Outlet /> : <Navigate to="/" replace />;
}
