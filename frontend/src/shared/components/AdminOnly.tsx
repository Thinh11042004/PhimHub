import { PropsWithChildren } from "react";
import { useAuth } from "../../store/auth";

export default function AdminOnly({ children }: PropsWithChildren) {
  const { user } = useAuth();
  if (user?.role !== "admin") return null;
  return <>{children}</>;
}
