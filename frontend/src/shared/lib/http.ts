import axios, { AxiosError, AxiosHeaders, AxiosInstance } from 'axios';
import { API_BASE_URL } from '../../config';

// Single Axios instance for the whole app
export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Attach Authorization header from localStorage on every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('phimhub:token');
  if (token) {
    const headers = config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

// Optional: pass-through response; errors are thrown by Axios
http.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export function handleHttpError(error: unknown): string {
  const err = error as AxiosError<any>;
  const status = err.response?.status;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn';
  if (status === 403) return 'Bạn không có quyền thực hiện hành động này';
  if (status === 404) return 'Không tìm thấy tài nguyên';
  if (status === 422) return 'Dữ liệu không hợp lệ';
  if (status === 500) return 'Lỗi server, vui lòng thử lại sau';
  return (err.response?.data?.message as string) || err.message || 'Có lỗi xảy ra';
}
