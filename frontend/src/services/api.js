import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

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
