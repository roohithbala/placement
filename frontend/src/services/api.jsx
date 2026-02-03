import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Auth APIs
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (data) => api.patch('/auth/preferences', data),
}

// Profile APIs
export const profileAPI = {
  create: (data) => api.post('/profile', data),
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
}

// Experience APIs
export const experienceAPI = {
  // New Methods
  saveMetadata: (data) => api.post('/experience/metadata', data),
  saveDraft: (data) => api.post('/experience/draft', data),
  saveRounds: (experienceId, rounds) => api.post(`/experience/rounds/${experienceId}`, { rounds }),
  saveMaterials: (experienceId, materials) => api.post(`/experience/materials/${experienceId}`, { materials }),
  submit: (experienceId) => api.post(`/experience/submit/${experienceId}`),

  // Existing/Updated Methods
  getAll: () => api.get('/experience/recent'),
  getMyExperiences: () => api.get('/experience/my'),
  getById: (id) => api.get(`/experience/${id}`),
  delete: (id) => api.delete(`/experience/${id}`),

  // Helper for loading draft state if needed (optional usage)
  getDraft: () => api.get('/experience/draft'),
  getOptions: () => api.get('/experience/options'),
  browse: (params) => api.get('/experience/browse', { params }),
  getPlatformStats: () => api.get('/experience/stats'),
}

// Message APIs
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  startConversation: (otherUserId) => api.post('/messages/conversations', { otherUserId }),
  getMessages: (conversationId) => api.get(`/messages/${conversationId}`),
  sendMessage: (data) => api.post('/messages', data),
  markAsRead: (conversationId) => api.put(`/messages/${conversationId}/read`),
}

// Mentorship APIs
export const mentorshipAPI = {
  getMentors: (params) => api.get('/mentorship/mentors', { params }),
  getMentees: (params) => api.get('/mentorship/mentees', { params }),
  getStats: () => api.get('/mentorship/stats'),
  sendRequest: (data) => api.post('/mentorship/request', data),
  getReceivedRequests: (params) => api.get('/mentorship/requests/received', { params }),
  getSentRequests: (params) => api.get('/mentorship/requests/sent', { params }),
  respondToRequest: (requestId, status) => api.put(`/mentorship/requests/${requestId}/respond`, { status }),
  completeRequest: (requestId) => api.put(`/mentorship/requests/${requestId}/complete`),
  cancelRequest: (requestId, reason) => api.put(`/mentorship/requests/${requestId}/cancel`, { reason }),
  submitFeedback: (requestId, data) => api.post(`/mentorship/requests/${requestId}/feedback`, data),
  updateNotes: (requestId, data) => api.put(`/mentorship/requests/${requestId}/notes`, data),
  incrementSession: (requestId) => api.put(`/mentorship/requests/${requestId}/session`),
}

// Meeting APIs
export const meetingAPI = {
  create: (data) => api.post('/meetings', data),
  getMeetings: (params) => api.get('/meetings', { params }),
  getMeetingById: (meetingId) => api.get(`/meetings/${meetingId}`),
  update: (meetingId, data) => api.put(`/meetings/${meetingId}`, data),
  cancel: (meetingId, reason) => api.put(`/meetings/${meetingId}/cancel`, { reason }),
  complete: (meetingId, notes) => api.put(`/meetings/${meetingId}/complete`, { notes }),
}

// Question APIs (Q&A Forum)
export const questionAPI = {
  create: (data) => api.post('/questions', data),
  getAll: (params) => api.get('/questions', { params }),
  getById: (questionId) => api.get(`/questions/${questionId}`),
  getMyQuestions: () => api.get('/questions/my'),
  addAnswer: (questionId, content) => api.post(`/questions/${questionId}/answers`, { content }),
  markAnswerHelpful: (questionId, answerId) => api.put(`/questions/${questionId}/answers/${answerId}/helpful`),
  markAsResolved: (questionId) => api.put(`/questions/${questionId}/resolve`),
  delete: (questionId) => api.delete(`/questions/${questionId}`),
}

// Notification APIs
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (notificationId) => api.delete(`/notifications/${notificationId}`),
  report: (data) => api.post('/notifications/report', data),
  blockUser: (blockedUserId, reason) => api.post('/notifications/block', { blockedUserId, reason }),
  unblockUser: (blockedUserId) => api.delete(`/notifications/block/${blockedUserId}`),
  getBlockedUsers: () => api.get('/notifications/blocked'),
}

// Admin APIs
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getStudents: (params) => api.get('/admin/students', { params }),
  getPlacedStudents: (params) => api.get('/admin/placed-students', { params }),
  getProblems: (params) => api.get('/admin/problems', { params }),
  getStudentDetail: (id) => api.get(`/admin/students/${id}`),
  getProblemDetail: (id) => api.get(`/admin/problems/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  deleteProblem: (id, reason) => api.post(`/admin/problems/${id}/delete`, { reason }),
  getMeetings: () => api.get('/admin/meetings'),
  updateMeeting: (id, data) => api.put(`/admin/meetings/${id}`, data),
  getLogs: (params) => api.get('/admin/logs', { params }),
}

// Anonymous Chat APIs (kept separate from Q&A forum)
export const anonQuestionService = {
  getQuestions: () => api.get('/anon-questions'),
  createQuestion: (text, sessionId) => api.post('/anon-questions', { text, sessionId }),
  updateStatus: (id, status) => api.patch(`/anon-questions/${id}/status`, { status }),
}

export const answerService = {
  getAnswers: (questionId) => api.get(`/answers/${questionId}`),
}

export const sessionService = {
  init: (data) => api.post('/sessions/init', data),
}

export const opportunitiesAPI = {
  list: (params = {}) => api.get('/opportunities', { params }),
  getFilters: () => api.get('/opportunities/filters'),
  getById: (id) => api.get(`/opportunities/${id}`),
  create: (data) => api.post('/opportunities', data),
}

export default api

