import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch {
        window.location.href = '/login';
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
};

export const programApi = {
  currentDay: () => api.get('/program/current-day'),
  getDay: (dayNumber: number) => api.get(`/program/day/${dayNumber}`),
  completeContent: (dayNumber: number, contentId: string, answers?: any) =>
    api.post(`/program/day/${dayNumber}/content/${contentId}/complete`, { answers }),
  saveReflection: (data: any) => api.post('/program/reflection', data),
  progress: () => api.get('/program/progress'),
  previousDay: () => api.post('/program/previous-day'),
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