import axios from 'axios';

let getAccessToken: () => string | null = () => null;
let updateAccessToken: (token: string | null) => void = () => {};
let refreshPromise: Promise<string> | null = null;

export function configureAuthTokenHandlers(
  getter: () => string | null,
  setter: (token: string | null) => void,
) {
  getAccessToken = getter;
  updateAccessToken = setter;
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh')
            .then(({ data }) => {
              updateAccessToken(data.accessToken);
              return data.accessToken as string;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const accessToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        updateAccessToken(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/me', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const programApi = {
  currentDay: () => api.get('/program/current-day'),
  getDay: (dayNumber: number) => api.get(`/program/day/${dayNumber}`),
  getDays: () => api.get('/program/days'),
  achievements: () => api.get('/program/achievements'),
  completeContent: (dayNumber: number, contentId: string, answers?: any) =>
    api.post(`/program/day/${dayNumber}/content/${contentId}/complete`, { answers }),
  saveReflection: (data: any) => api.post('/program/reflection', data),
  progress: () => api.get('/program/progress'),
  previousDay: () => api.post('/program/previous-day'),
  search: (q: string) => api.get('/program/search', { params: { q } }),
  useFreeze: () => api.post('/program/use-freeze'),
};

export const membershipApi = {
  status: () => api.get('/membership/status'),
  requestPayment: (data?: any) => api.post('/membership/membership/payment/request', data),
  requestMonthlyPayment: (data?: any) => api.post('/membership/monthly/payment/request', data),
  paymentStatus: (id: string) => api.get(`/membership/payments/${id}/status`),
  earnings: () => api.get('/membership/earnings'),
  network: () => api.get('/membership/network'),
  withdrawals: () => api.get('/membership/withdrawals'),
  requestWithdrawal: (data: any) => api.post('/membership/withdrawals', data),
};

export const adminBusinessApi = {
  settings: () => api.get('/admin/business/settings'),
  updateSettings: (data: any) => api.put('/admin/business/settings', data),
  payments: () => api.get('/admin/business/payments'),
  approvePayment: (id: string) => api.post(`/admin/business/payments/${id}/approve`),
  rejectPayment: (id: string) => api.post(`/admin/business/payments/${id}/reject`),
  network: () => api.get('/admin/business/network'),
  withdrawals: () => api.get('/admin/business/withdrawals'),
  approveWithdrawal: (id: string) => api.post(`/admin/business/withdrawals/${id}/approve`),
  rejectWithdrawal: (id: string) => api.post(`/admin/business/withdrawals/${id}/reject`),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (params?: any) => api.get('/admin/users', { params }),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  getDays: () => api.get('/admin/program/days'),
  createDay: (data: any) => api.post('/admin/program/days', data),
  updateDay: (id: string, data: any) => api.put(`/admin/program/days/${id}`, data),
  deleteDay: (id: string) => api.delete(`/admin/program/days/${id}`),
  createContent: (data: any) => api.post('/admin/program/contents', data),
  updateContent: (id: string, data: any) => api.put(`/admin/program/contents/${id}`, data),
  deleteContent: (id: string) => api.delete(`/admin/program/contents/${id}`),
  reorderContents: (dayId: string, contentIds: string[]) =>
    api.put(`/admin/program/days/${dayId}/reorder`, { contentIds }),
  analytics: () => api.get('/admin/analytics/overview'),
};
