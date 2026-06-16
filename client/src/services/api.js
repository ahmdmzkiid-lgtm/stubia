import axios from 'axios';
import toast from 'react-hot-toast';

let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
if (baseUrl && !baseUrl.endsWith('/api') && !baseUrl.endsWith('/api/')) {
  baseUrl = baseUrl.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: baseUrl,
});

// Request Interceptor: Attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Optional: auto redirect
    }
    toast.error(message);
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  loginWithGoogle: (accessToken) => api.post('/auth/google', { access_token: accessToken }),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
};

export const soalService = {
  list: (params) => api.get('/soal', { params }),
  create: (data) => api.post('/soal', data),
  delete: (id) => api.delete(`/soal/${id}`),
  deleteAllBySubject: (subjectId) => api.delete(`/soal/all/by-subject/${subjectId}`),
  shuffleChoices: (questionId) => api.post(`/soal/shuffle/${questionId}`),
  update: (id, data) => api.patch(`/soal/${id}`, data),
  reorderQuestions: (questionIds) => api.patch('/soal/reorder/batch', { questionIds }),
  getBySubject: (subjectName, params) => api.get('/soal/by-subject', { params: { subject: subjectName, ...params } }),
};

export const tryoutService = {
  listPackages: () => api.get('/tryout/packages'),
  createPackage: (data) => api.post('/tryout/packages', data),
  updatePackage: (id, data) => api.patch(`/tryout/packages/${id}`, data),
  deletePackage: (id) => api.delete(`/tryout/packages/${id}`),
  getPackageStats: (id) => api.get(`/tryout/packages/${id}/stats`),
  start: (packageId, selectedSubjects) => api.post('/tryout/start', { package_id: packageId, selected_subjects: selectedSubjects }),
  getQuestions: (sessionId) => api.get(`/tryout/session/${sessionId}/questions`),
  answer: (data) => api.post('/tryout/answer', data),
  answerBatch: (data) => api.post('/tryout/answer-batch', data),
  submit: (sessionId) => api.post('/tryout/submit', { session_id: sessionId }),
  submitBulk: (payload) => api.post('/tryout/submit-bulk', payload),
  getResult: (sessionId) => api.get(`/tryout/result/${sessionId}`),
  getCombinedResult: (sessionIds, packageId) => api.post('/tryout/result/combined', { session_ids: sessionIds, package_id: packageId }),
  getLeaderboard: (packageId, limit) => api.get(`/tryout/leaderboard/${packageId}`, { params: { limit } }),
  getLatihanLeaderboard: (subjectId, topicId, limit) => api.get(`/tryout/leaderboard/latihan/${subjectId}`, { params: { topic_id: topicId, limit } }),
  registerForTryout: (data) => api.post('/tryout/register', data),
  getRegistrationStatus: (packageType, packageId) => api.get(`/tryout/registration-status/${packageType}/${packageId}`),
  getMyTryoutUsage: () => api.get('/tryout/my-tryout-usage'),
};

export const bookmarkService = {
  list: () => api.get('/bookmark'),
  toggle: (questionId) => api.post(`/bookmark/${questionId}`),
};

export const adminService = {
  importExcel: (formData) => api.post('/import/excel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  getTryoutRegistrations: (params) => api.get('/admin/tryout-registrations', { params }),
  updateTryoutRegistration: (id, data) => api.patch(`/admin/tryout-registrations/${id}`, data),
  deleteTryoutRegistration: (id) => api.delete(`/admin/tryout-registrations/${id}`),
  getActivity: (params) => api.get('/admin/activity', { params }),
  streamActivity: (token) => {
    const url = new URL((import.meta.env.VITE_API_URL || 'http://localhost:3001/api') + '/admin/activity/stream');
    if (token) url.searchParams.set('token', token);
    return new EventSource(url.toString());
  },
};

export const subjectService = {
  list: () => api.get('/subjects'),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.patch(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
  // Topics
  listTopics: (subjectId) => api.get(`/subjects/${subjectId}/topics`),
  createTopic: (subjectId, data) => api.post(`/subjects/${subjectId}/topics`, data),
  updateTopic: (topicId, data) => api.patch(`/topics/${topicId}`, data),
  deleteTopic: (topicId) => api.delete(`/topics/${topicId}`),
};

export const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.patch('/settings', data),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  getUnshown: () => api.get('/notifications/unshown'),
  markModalShown: (id) => api.patch(`/notifications/${id}/modal-shown`),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  send: (data) => api.post('/notifications/send', data), // Admin only
  getHistory: () => api.get('/notifications/admin/history'), // Admin only
};

export const activityService = {
  getRecent: () => api.get('/activity'),
  getRiwayat: () => api.get('/activity/riwayat'),
  submitLatihan: (data) => api.post('/activity/latihan/submit', data),
  getLatihanResult: (sessionId) => api.get(`/activity/latihan/result/${sessionId}`),
};

export const socialService = {
  submitVerification: (data) => api.post('/social/verify', data),
  getStatus: () => api.get('/social/status'),
  listPending: () => api.get('/social/admin/requests'),
  listAll: (status) => api.get('/social/admin/requests/all', { params: status ? { status } : {} }),
  reviewRequest: (id, payload) => api.patch(`/social/admin/requests/${id}`, payload),
  deleteRequest: (id) => api.delete(`/social/admin/requests/${id}`),
};

export const chatService = {
  sendMessage: (message, history) => api.post('/chat', { message, history }),
  discussQuestion: (message, questionContext, history) => api.post('/chat/discuss', { message, questionContext, history }),
};

export const subscriptionService = {
  getPlans: () => api.get('/subscription/plans'),
  getMySubscription: () => api.get('/subscription/my-subscription'),
  subscribe: (planId) => api.post('/subscription/subscribe', { planId }),
  confirmPayment: (orderId) => api.post('/subscription/confirm', { order_id: orderId }),
  getClientKey: () => api.get('/subscription/midtrans-client-key'),
  getTransactions: () => api.get('/subscription/transactions'),
};

export const battleService = {
  createMatch: (data) => api.post('/battle/create', data),
  joinMatch: (data) => api.post('/battle/join', data),
  submitAnswer: (data) => api.post('/battle/submit-answer', data),
  getMatchStatus: (matchId) => api.get(`/battle/${matchId}?t=${Date.now()}`),
  getRandomMatch: (subjectId) => api.get(`/battle/random-match/${subjectId}`),
  completeMatch: (data) => api.post('/battle/complete', data),
  getLeaderboard: (subjectId) => api.get(`/battle/leaderboard/${subjectId}?t=${Date.now()}`),
  getQuestions: (questionIds) => api.get('/battle/questions', { params: { ids: JSON.stringify(questionIds) } }),
  leaveMatch: (data) => api.post('/battle/leave', data),
};

export const ujianMandiriService = {
  // Banner
  getBanner: () => api.get('/ujian-mandiri/banner'),
  updateBanner: (data) => api.patch('/ujian-mandiri/banner', data),
  // Ujian Mandiri CRUD
  list: () => api.get('/ujian-mandiri'),
  getById: (id) => api.get(`/ujian-mandiri/${id}`),
  create: (data) => api.post('/ujian-mandiri', data),
  update: (id, data) => api.patch(`/ujian-mandiri/${id}`, data),
  delete: (id) => api.delete(`/ujian-mandiri/${id}`),
  // Tryout Packages
  getTryoutPackages: (ujianId) => api.get(`/ujian-mandiri/${ujianId}/tryout-packages`),
  createTryoutPackage: (ujianId, data) => api.post(`/ujian-mandiri/${ujianId}/tryout-packages`, data),
  updateTryoutPackage: (id, data) => api.patch(`/ujian-mandiri/tryout-packages/${id}`, data),
  deleteTryoutPackage: (id) => api.delete(`/ujian-mandiri/tryout-packages/${id}`),
  // Latihan Soal
  getLatihan: (ujianId) => api.get(`/ujian-mandiri/${ujianId}/latihan`),
  createLatihan: (ujianId, data) => api.post(`/ujian-mandiri/${ujianId}/latihan`, data),
  updateLatihan: (id, data) => api.patch(`/ujian-mandiri/latihan/${id}`, data),
  deleteLatihan: (id) => api.delete(`/ujian-mandiri/latihan/${id}`),
  // Questions
  getQuestions: (params) => api.get('/ujian-mandiri/questions', { params }),
  createQuestion: (data) => api.post('/ujian-mandiri/questions', data),
  updateQuestion: (id, data) => api.patch(`/ujian-mandiri/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/ujian-mandiri/questions/${id}`),
  deleteAllQuestions: (data) => api.delete('/ujian-mandiri/questions/bulk', { data }),
  shuffleChoices: (questionId) => api.post(`/ujian-mandiri/questions/shuffle/${questionId}`),
  importExcel: (formData) => api.post('/ujian-mandiri/questions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Tryout Sessions (Persisted Flow)
  startTryout: (tryoutPackageId) => api.post('/ujian-mandiri/tryout/start', { tryout_package_id: tryoutPackageId }),
  getTryoutSessionQuestions: (sessionId) => api.get(`/ujian-mandiri/tryout/session/${sessionId}/questions`),
  submitTryoutBulk: (payload) => api.post('/ujian-mandiri/tryout/submit-bulk', payload),
  getTryoutResult: (sessionId) => api.get(`/ujian-mandiri/tryout/result/${sessionId}`),
  getLatihanResult: (sessionId) => api.get(`/ujian-mandiri/latihan/result/${sessionId}`),
  getTryoutLeaderboard: (packageId, limit) => api.get(`/ujian-mandiri/tryout/leaderboard/${packageId}`, { params: { limit } }),
  getLatihanLeaderboard: (latihanId, limit) => api.get(`/ujian-mandiri/latihan/leaderboard/${latihanId}`, { params: { limit } }),
};

export const uploadService = {
  uploadImage: (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteImage: (publicId) => api.delete('/upload/image', { data: { public_id: publicId } }),
};

export const teamService = {
  list: () => api.get('/team'),
  create: (data) => api.post('/admin/team', data),
  update: (id, data) => api.patch(`/admin/team/${id}`, data),
  delete: (id) => api.delete(`/admin/team/${id}`),
};

export default api;
