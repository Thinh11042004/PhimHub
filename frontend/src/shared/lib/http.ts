// HTTP client utilities and helpers
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface HttpError extends Error {
  status?: number;
  response?: any;
}

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('phimhub:token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error: HttpError = new Error(`HTTP Error: ${response.status}`);
        error.status = response.status;
        
        try {
          error.response = await response.json();
        } catch {
          error.response = await response.text();
        }
        
        throw error;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const query = params ? this.buildQuery(params) : '';
    const url = query ? `${endpoint}?${query}` : endpoint;
    
    return this.request<T>(url, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  private buildQuery(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    
    return searchParams.toString();
  }
}

// Export singleton instance
export const http = new HttpClient();

// Export error handler utility
export function handleHttpError(error: HttpError): string {
  if (error.status === 401) {
    return 'Phiên đăng nhập đã hết hạn';
  }
  
  if (error.status === 403) {
    return 'Bạn không có quyền thực hiện hành động này';
  }
  
  if (error.status === 404) {
    return 'Không tìm thấy tài nguyên';
  }
  
  if (error.status === 422) {
    return 'Dữ liệu không hợp lệ';
  }
  
  if (error.status === 500) {
    return 'Lỗi server, vui lòng thử lại sau';
  }
  
  if (error.response?.message) {
    return error.response.message;
  }
  
  return error.message || 'Có lỗi xảy ra';
}
