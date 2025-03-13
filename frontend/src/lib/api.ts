import axios from "axios";

const API_URL = "http://localhost:8000";

// Track token refresh state
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Store Clerk session reference that components can set
let clerkSessionRef: any = null;

// Function to set the clerk session ref (call this from your AuthProvider component)
export const setClerkSessionRef = (session: any) => {
  clerkSessionRef = session;
};

// Helper to decode JWT and check expiration
const isTokenExpired = (token: string): boolean => {
  if (!token) return true;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64));

    // Get expiration time (exp is in seconds, convert to milliseconds)
    const expirationTime = payload.exp * 1000;

    // Consider token expired 30 seconds before actual expiration for safety margin
    return Date.now() > expirationTime - 30000;
  } catch (e) {
    console.error("Error parsing token:", e);
    return true;
  }
};

// Function to refresh token using Clerk
const refreshToken = async (): Promise<string | null> => {
  // Don't refresh if already refreshing
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push((token) => resolve(token));
    });
  }

  isRefreshing = true;

  try {
    // Use the React clerk session reference if available
    if (clerkSessionRef) {
      const token = await clerkSessionRef.getToken();
      if (token) {
        localStorage.setItem("clerk-token", token);

        // Notify all subscribers about the new token
        refreshSubscribers.forEach((callback) => callback(token));
        refreshSubscribers = [];

        return token;
      }
      return null;
    }

    // Fallback to getting from localStorage if no active session reference
    const currentToken = localStorage.getItem("clerk-token");

    // If token isn't expired or we don't have one, return what we have
    if (!currentToken || !isTokenExpired(currentToken)) {
      return currentToken;
    }

    console.warn("No active Clerk session reference available for refresh");
    return null;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return null;
  } finally {
    isRefreshing = false;
  }
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: validate and refresh token before requests
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem("clerk-token");

    // Check token validity
    if (token && isTokenExpired(token)) {
      console.log("Token expired, refreshing...");
      const refreshedToken = await refreshToken();

      if (refreshedToken) {
        token = refreshedToken;
      } else {
        console.warn("Token refresh failed");
        // Let the request proceed without token, backend will return 401 if needed
      }
    }

    // Apply token to request
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 errors and retry with fresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 Unauthorized and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/me") // Avoid infinite loop on auth endpoints
    ) {
      originalRequest._retry = true;

      // Try to refresh token
      const newToken = await refreshToken();

      if (newToken) {
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const chatApi = {
  // Chat sessions
  getChatSessions: () => api.get("/chat/sessions"),
  getChatSession: (sessionId: number) => api.get(`/chat/sessions/${sessionId}`),
  createChatSession: (data: { name: string }) =>
    api.post("/chat/sessions", data),
  updateChatSession: (sessionId: number, data: { name: string }) =>
    api.put(`/chat/sessions/${sessionId}`, data),
  deleteChatSession: (sessionId: number) =>
    api.delete(`/chat/sessions/${sessionId}`),
};

export const pdfApi = {
  uploadPdf: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return api.post("/pdf/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000, // 30 seconds for large files
    });
  },

  listPdfs: () =>
    api.get("/pdf/list").then((response) => {
      // Ensure we always return an array
      return {
        ...response,
        data: Array.isArray(response.data) ? response.data : [],
      };
    }),

  addPdfToSession: (sessionId: number, pdfId: number) =>
    api.post(`/pdf/sessions/${sessionId}/add_pdf/${pdfId}`),

  removePdfFromSession: (sessionId: number, pdfId: number) =>
    api.delete(`/pdf/sessions/${sessionId}/remove_pdf/${pdfId}`),

  listSessionPdfs: (sessionId: number) =>
    api.get(`/pdf/sessions/${sessionId}/pdfs`).then((response) => {
      // Ensure we always return an array
      return {
        ...response,
        data: Array.isArray(response.data) ? response.data : [],
      };
    }),
};

export const userApi = {
  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/me");
      return { data: response.data }; // Return object with data property
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      return { data: null }; // Return object with null data
    }
  },
  updateProfile: (userData: { username?: string; email?: string }) =>
    api.put("/auth/profile", userData),
};

// Expose a way to manually trigger token refresh
export const authUtils = {
  refreshToken,
  isTokenValid: () => {
    const token = localStorage.getItem("clerk-token");
    return token && !isTokenExpired(token);
  },
};

export const eduApi = {
  // Get learning progress for all PDFs in a session
  getSessionProgress: (sessionId: number) =>
    api.get(`/edu/progress/session/${sessionId}`),

  // Submit quiz answers
  submitQuiz: (
    quizId: number,
    sessionId: number,
    answers: Record<string, number>
  ) => api.post(`/edu/quiz/${quizId}/submit?session_id=${sessionId}`, answers),

  // Mark PDF as read in a session
  trackPdfRead: (pdfId: number, sessionId: number) =>
    api.post(`/edu/track/${pdfId}/read?session_id=${sessionId}`),

  // Get quiz for a specific PDF
  getQuizForPdf: (pdfId: number) => api.get(`/edu/quiz/${pdfId}`),

  // Get summary for a specific PDF
  getPdfSummary: (pdfId: number) => api.get(`/edu/summary/${pdfId}`),
};

export default api;
