import axios from 'axios';

// Startup logging for API configuration verification
console.log('API URL:', import.meta.env.VITE_API_URL);

// Centralized Axios Instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('caos_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh the access token once on a 401, then retry the original request.
let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt token refresh for auth endpoints to prevent loops
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('caos_refresh_token');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(api(originalRequest)));
        });
      }

      isRefreshing = true;
      try {
        const { data } = await api.post('/auth/refresh', { refreshToken });
        localStorage.setItem('caos_access_token', data.accessToken);
        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Centralized Auth Module API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
};

// Client Module API
export const clientApi = {
  list: (params?: any) => api.get('/clients', { params }).then((res) => res.data),
  get: (id: string) => api.get(`/clients/${id}`).then((res) => res.data.client),
  create: (data: any) => api.post('/clients', data).then((res) => res.data.client),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data).then((res) => res.data.client),
  delete: (id: string) => api.delete(`/clients/${id}`).then((res) => res.data),
  import: (rows: any[]) => api.post('/clients/import', { rows }).then((res) => res.data),
  export: () => api.get('/clients/export').then((res) => res.data.clients),
  addNote: (id: string, body: string, category?: string) =>
    api.post(`/clients/${id}/notes`, { body, category }).then((res) => res.data.note),
};

// GST Workspace Module API
export const gstApi = {
  getWorkspace: (params?: any) => api.get('/gst', { params }).then((res) => res.data),
  createReturn: (data: any) => api.post('/gst', data).then((res) => res.data),
  autoGenerate: (period?: string) => api.post('/gst/auto-generate', { period }).then((res) => res.data),
  import: (rows: any[]) => api.post('/gst/import', { rows }).then((res) => res.data),
  export: () => api.get('/gst/export').then((res) => res.data.returns),
  updateStatus: (id: string, data: any) => api.patch(`/gst/${id}/status`, data).then((res) => res.data),
};

// ITR Workspace Module API
export const itrApi = {
  getWorkspace: (params?: any) => api.get('/itr', { params }).then((res) => res.data),
  createReturn: (data: any) => api.post('/itr', data).then((res) => res.data),
  import: (rows: any[]) => api.post('/itr/import', { rows }).then((res) => res.data),
  export: () => api.get('/itr/export').then((res) => res.data.returns),
  updateStatus: (id: string, data: any) => api.patch(`/itr/${id}/status`, data).then((res) => res.data),
};

// Employee / Staff Management API
export const employeeApi = {
  list: () => api.get('/employees').then((res) => res.data),
  create: (data: any) => api.post('/employees', data).then((res) => res.data),
  toggleActive: (id: string) => api.patch(`/employees/${id}/toggle-active`).then((res) => res.data),
  resetPassword: (id: string, newPassword: string) =>
    api.patch(`/employees/${id}/reset-password`, { newPassword }).then((res) => res.data),
  getById: (id: string) => api.get(`/employees/${id}`).then((res) => res.data),
};

// FollowUp Module API
export const followupApi = {
  list: (params?: any) => api.get('/followups', { params }).then((res) => res.data),
  create: (data: any) => api.post('/followups', data).then((res) => res.data),
  updateStatus: (id: string, data: any) => api.patch(`/followups/${id}/status`, data).then((res) => res.data),
};

// Revenue & Billing API
export const revenueApi = {
  getData: (params?: any) => api.get('/revenue', { params }).then((res) => res.data),
  createInvoice: (data: any) => api.post('/revenue', data).then((res) => res.data),
  recordPayment: (id: string, additionalPayment: number) =>
    api.patch(`/revenue/${id}/payment`, { additionalPayment }).then((res) => res.data),
};

// Document Vault API
export const documentApi = {
  list: (params?: any) => api.get('/documents', { params }).then((res) => res.data.documents),
  upload: (formData: FormData) =>
    api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data.document),
  delete: (id: string) => api.delete(`/documents/${id}`).then((res) => res.data),
};

// Credential Vault API
export const credentialApi = {
  list: (params?: any) => api.get('/credentials', { params }).then((res) => res.data.credentials),
  reveal: (id: string) => api.post(`/credentials/${id}/reveal`).then((res) => res.data.secret || res.data.password),
  create: (data: any) => api.post('/credentials', data).then((res) => res.data.credential),
};

// Task Management API
export const taskApi = {
  list: (params?: any) => api.get('/tasks', { params }).then((res) => res.data.tasks),
  export: () => api.get('/tasks/export').then((res) => res.data.tasks),
  create: (data: any) => api.post('/tasks', data).then((res) => res.data.task),
  updateStatus: (id: string, status: string) => api.patch(`/tasks/${id}/status`, { status }).then((res) => res.data.task),
  addComment: (id: string, body: string) => api.post(`/tasks/${id}/comments`, { body }).then((res) => res.data.comment),
};

// Global Search API
export const searchApi = {
  globalSearch: (q: string) => api.get(`/search?q=${encodeURIComponent(q)}`).then((res) => res.data),
};

// AI Assistant API
export const aiApi = {
  getNotices: (params?: any) => api.get('/ai/notices', { params }).then((res) => res.data.notices),
  chat: (prompt: string, conversationId?: string) => api.post('/ai/chat', { prompt, conversationId }).then((res) => res.data),
};

// Dashboard Stats API
export const dashboardApi = {
  getStats: () => api.get('/dashboard').then((res) => res.data),
};
