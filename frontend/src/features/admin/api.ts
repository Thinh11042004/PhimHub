// /admin/* API
import { User } from "../../store/auth";
import { apiRequest, getApiBaseUrl } from "../../shared/lib/api";

const BASE = `${getApiBaseUrl()}/admin`;

async function call<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(`/admin${endpoint}`, options);
}

export const adminApi = {
  async listUsers(): Promise<Array<User & { role_code?: string }>> {
    const r = await call<{ success: boolean; data: any[] }>("/users");
    return r.data.map((u) => ({
      id: String(u.id),
      email: u.email,
      username: u.username,
      avatar: u.avatar || "",
      role: (u.role_code || "user") as any,
    }));
  },

  async createUser(body: { username: string; email: string; password: string; fullname?: string; phone?: string; role_id?: number }) {
    return call(`/users`, { method: "POST", body: JSON.stringify(body) });
  },

  async updateUser(id: number, body: Partial<{ username: string; email: string; fullname: string; phone: string; role_id: number; status: string }>) {
    return call(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },

  async deleteUser(id: number) {
    return call(`/users/${id}`, { method: "DELETE" });
  },

  // ===== Genres =====
  async listGenres(): Promise<Array<{ id: number; name: string; movie_count?: number }>> {
    const r = await apiRequest<{ success: boolean; data: any[] }>(`/genres`);
    return r.data.map((g) => ({ id: g.id, name: g.name, movie_count: g.movie_count }));
  },
  async createGenre(name: string) {
    return call(`/genres`, { method: 'POST', body: JSON.stringify({ name }) });
  },
  async updateGenre(id: number, name: string) {
    return call(`/genres/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
  },
  async deleteGenre(id: number) {
    return call(`/genres/${id}`, { method: 'DELETE' });
  },
};

