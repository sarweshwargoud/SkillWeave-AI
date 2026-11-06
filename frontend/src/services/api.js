import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const parseYouTube = async (urlOrId) => {
  try {
    const response = await axios.post(`${API_URL}/youtube/parse`, {
      url_or_id: urlOrId
    });
    return response.data;
  } catch (error) {
    console.error("Error parsing YouTube URL:", error);
    throw error;
  }
};

export const fetchTranscript = async (videoId) => {
  try {
    const response = await axios.get(`${API_URL}/youtube/transcript`, {
      params: { video_id: videoId }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
};

export const generateHandwrittenNotes = async (videoIdOrUrl, noteStyle = "detailed") => {
  try {
    const response = await axios.post(`${API_URL}/notes/generate`, {
      video_id_or_url: videoIdOrUrl,
      note_style: noteStyle
    });
    return response.data;
  } catch (error) {
    console.error("Error generating notes:", error);
    throw error;
  }
};

export const askAITutor = async (videoIdOrUrl, question, timestampContext = null, chatHistory = []) => {
  try {
    const response = await axios.post(`${API_URL}/tutor/chat`, {
      video_id_or_url: videoIdOrUrl,
      question: question,
      timestamp_context: timestampContext,
      chat_history: chatHistory
    });
    return response.data;
  } catch (error) {
    console.error("Error contacting AI tutor:", error);
    throw error;
  }
};

export const generateQuiz = async (videoIdOrUrl, numQuestions = 5) => {
  try {
    const response = await axios.post(`${API_URL}/quiz/generate`, {
      video_id_or_url: videoIdOrUrl,
      num_questions: numQuestions
    });
    return response.data;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const generateRoadmapFromURL = async (urlOrId, level = "Beginner") => {
  try {
    const response = await axios.post(`${API_URL}/roadmap/generate-from-url`, {
      url_or_id: urlOrId,
      level: level
    });
    return response.data;
  } catch (error) {
    console.error("Error generating roadmap from URL:", error);
    throw error;
  }
};

export const generateCourse = async (topic, level, accentPreference) => {
  try {
    const response = await axios.post(`${API_URL}/generate`, {
      topic,
      level,
      accent_preference: accentPreference
    });
    return response.data;
  } catch (error) {
    console.error("Error generating course:", error);
    throw error;
  }
};
