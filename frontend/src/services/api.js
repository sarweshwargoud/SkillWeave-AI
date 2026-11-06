import axios from 'axios';
import { getClient } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create configured axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatic Bearer Token Interceptor
api.interceptors.request.use(async (config) => {
  try {
    const client = getClient();
    if (client?.auth) {
      const { data } = await client.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn("Could not attach auth token to request:", err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Automatic 401 Session Refresh Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const client = getClient();
        if (client?.auth) {
          const { data, error: refreshError } = await client.auth.refreshSession();
          if (!refreshError && data?.session?.access_token) {
            originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshErr) {
        console.warn("Auto-token refresh notice:", refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

// --- Public / AI Video Endpoints ---

export const parseYouTube = async (urlOrId) => {
  const response = await api.post('/youtube/parse', { url_or_id: urlOrId });
  return response.data;
};

export const fetchTranscript = async (videoId) => {
  const response = await api.get('/youtube/transcript', {
    params: { video_id: videoId }
  });
  return response.data;
};

export const generateHandwrittenNotes = async (videoIdOrUrl, noteStyle = "detailed", autoSave = false) => {
  const response = await api.post('/notes/generate', {
    video_id_or_url: videoIdOrUrl,
    note_style: noteStyle,
    auto_save: autoSave
  });
  return response.data;
};

export const askAITutor = async (videoIdOrUrl, question, timestampContext = null, chatHistory = []) => {
  const response = await api.post('/tutor/chat', {
    video_id_or_url: videoIdOrUrl,
    question: question,
    timestamp_context: timestampContext,
    chat_history: chatHistory
  });
  return response.data;
};

export const generateQuiz = async (videoIdOrUrl, numQuestions = 5) => {
  const response = await api.post('/quiz/generate', {
    video_id_or_url: videoIdOrUrl,
    num_questions: numQuestions
  });
  return response.data;
};

export const generateRoadmapFromURL = async (urlOrId, level = "Beginner", autoSave = false) => {
  const response = await api.post('/roadmap/generate-from-url', {
    url_or_id: urlOrId,
    level: level,
    auto_save: autoSave
  });
  return response.data;
};

export const generateCourse = async (topic, level, accentPreference) => {
  const response = await api.post('/generate', {
    topic,
    level,
    accent_preference: accentPreference
  });
  return response.data;
};

// --- Authenticated User & Workspace Endpoints (Strict User Isolation) ---

export const fetchCurrentUser = async () => {
  const response = await api.get('/user/me');
  return response.data;
};

export const fetchWorkspaceSettings = async () => {
  const response = await api.get('/user/workspace-settings');
  return response.data;
};

export const saveWorkspaceSettings = async (settings) => {
  const response = await api.put('/user/workspace-settings', settings);
  return response.data;
};

export const fetchUserCourses = async () => {
  const response = await api.get('/user/courses');
  return response.data;
};

export const fetchUserCourseById = async (courseId) => {
  const response = await api.get(`/user/courses/${courseId}`);
  return response.data;
};

export const saveUserCourse = async (courseData) => {
  const response = await api.post('/user/courses', courseData);
  return response.data;
};

export const deleteUserCourse = async (courseId) => {
  const response = await api.delete(`/user/courses/${courseId}`);
  return response.data;
};

export const fetchUserProjects = async () => {
  const response = await api.get('/user/projects');
  return response.data;
};

export const saveUserProject = async (projectData) => {
  const response = await api.post('/user/projects', projectData);
  return response.data;
};

export const deleteUserProject = async (projectId) => {
  const response = await api.delete(`/user/projects/${projectId}`);
  return response.data;
};

export const fetchUserNotes = async () => {
  const response = await api.get('/user/notes');
  return response.data;
};

export const saveUserNote = async (noteData) => {
  const response = await api.post('/user/notes', noteData);
  return response.data;
};

export const deleteUserNote = async (noteId) => {
  const response = await api.delete(`/user/notes/${noteId}`);
  return response.data;
};

// Convenient Aliases
export const getWorkspaceSettings = fetchWorkspaceSettings;
export const updateWorkspaceSettings = saveWorkspaceSettings;
export const getUserCourses = fetchUserCourses;
export const getUserProjects = fetchUserProjects;
export const getUserNotes = fetchUserNotes;
