// ============================================================================
// API CLIENT - Frontend to Backend Communication
// ============================================================================

class APIClient {
    constructor(baseURL = 'http://localhost:3001/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken');
    }

    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    async register(username, email, password, language = 'en') {
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, language })
            });
            const data = await response.json();
            if (data.success) {
                this.setToken(data.token);
                return data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success) {
                this.setToken(data.token);
                return data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async createGuestSession() {
        try {
            const response = await fetch(`${this.baseURL}/auth/guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Guest session error:', error);
            throw error;
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // ========================================================================
    // USER MANAGEMENT
    // ========================================================================

    async getCurrentUser() {
        try {
            const response = await fetch(`${this.baseURL}/users/me`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Get user error:', error);
            throw error;
        }
    }

    async updateUser(updates) {
        try {
            const response = await fetch(`${this.baseURL}/users/me`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    }

    async updatePreferences(preferences) {
        try {
            const response = await fetch(`${this.baseURL}/users/me/preferences`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(preferences)
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Update preferences error:', error);
            throw error;
        }
    }

    // ========================================================================
    // PROGRESS TRACKING
    // ========================================================================

    async getProgress() {
        try {
            const response = await fetch(`${this.baseURL}/progress`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Get progress error:', error);
            throw error;
        }
    }

    async getLessonProgress(lessonId) {
        try {
            const response = await fetch(`${this.baseURL}/progress/${lessonId}`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Get lesson progress error:', error);
            throw error;
        }
    }

    async logAttempt(lessonId, attempt) {
        try {
            const response = await fetch(`${this.baseURL}/progress/${lessonId}/attempt`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(attempt)
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Log attempt error:', error);
            throw error;
        }
    }

    async updateSpacedRepetition(lessonId, correct) {
        try {
            const response = await fetch(`${this.baseURL}/progress/${lessonId}/spaced-repetition`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ correct })
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Update spaced repetition error:', error);
            throw error;
        }
    }

    async getDueReviews() {
        try {
            const response = await fetch(`${this.baseURL}/progress/reviews/due`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Get due reviews error:', error);
            throw error;
        }
    }

    // ========================================================================
    // ANALYTICS
    // ========================================================================

    async getInsights() {
        try {
            const response = await fetch(`${this.baseURL}/analytics/insights`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Get insights error:', error);
            throw error;
        }
    }

    async getHistory(limit = 30, lessonId = null) {
        try {
            let url = `${this.baseURL}/analytics/history?limit=${limit}`;
            if (lessonId) url += `&lessonId=${lessonId}`;
            
            const response = await fetch(url, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Get history error:', error);
            throw error;
        }
    }

    async getChartData() {
        try {
            const response = await fetch(`${this.baseURL}/analytics/chart-data`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Get chart data error:', error);
            throw error;
        }
    }

    // ========================================================================
    // LESSONS
    // ========================================================================

    async getLessons() {
        try {
            const response = await fetch(`${this.baseURL}/lessons`);
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Get lessons error:', error);
            throw error;
        }
    }

    async getLesson(lessonId) {
        try {
            const response = await fetch(`${this.baseURL}/lessons/${lessonId}`);
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.message);
        } catch (error) {
            console.error('Get lesson error:', error);
            throw error;
        }
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
    }

    isAuthenticated() {
        return !!this.token;
    }
}

// Initialize global API client
window.apiClient = new APIClient();
