import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Initialize the client if credentials exist, otherwise export a dummy client or null
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase credentials not found. The app is running in 'Demo Mode' with simulated login and project storage."
  );
}

// Local storage keys for Mock/Demo Mode
const MOCK_USER_KEY = 'skillweave_mock_user';
const MOCK_PROJECTS_KEY = 'skillweave_mock_projects';

// Mock client wrapper to simulate Supabase when credentials are missing
export const mockSupabase = {
  auth: {
    signUp: async ({ email, password, options }) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      const user = {
        id: 'mock-user-uuid-12345',
        email,
        user_metadata: { name: options?.data?.name || email.split('@')[0] }
      };
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
      return { data: { user, session: { access_token: 'mock-session-token' } }, error: null };
    },
    signInWithPassword: async ({ email, password }) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      // Simple validation
      if (password.length < 4) {
        return { data: { user: null, session: null }, error: { message: "Invalid password (must be at least 4 characters)" } };
      }
      const user = {
        id: 'mock-user-uuid-12345',
        email,
        user_metadata: { name: email.split('@')[0] }
      };
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
      return { data: { user, session: { access_token: 'mock-session-token' } }, error: null };
    },
    signInWithOAuth: async ({ provider }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Redirect simulated by completing login instantly
      const user = {
        id: 'mock-user-uuid-google',
        email: 'google.demo@example.com',
        user_metadata: { name: 'Google Explorer', avatar_url: 'https://lh3.googleusercontent.com/a/default-user=s150' }
      };
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
      return { data: { user }, error: null };
    },
    signOut: async () => {
      localStorage.removeItem(MOCK_USER_KEY);
      return { error: null };
    },
    getUser: async () => {
      const userStr = localStorage.getItem(MOCK_USER_KEY);
      return { data: { user: userStr ? JSON.parse(userStr) : null }, error: null };
    },
    onAuthStateChange: (callback) => {
      // Listen for changes
      const handleStorage = () => {
        const userStr = localStorage.getItem(MOCK_USER_KEY);
        const user = userStr ? JSON.parse(userStr) : null;
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
      };
      window.addEventListener('storage', handleStorage);
      
      // Call once initially
      const userStr = localStorage.getItem(MOCK_USER_KEY);
      const user = userStr ? JSON.parse(userStr) : null;
      // Slight delay to allow listeners to bind
      setTimeout(() => callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null), 50);

      return { data: { subscription: { unsubscribe: () => window.removeEventListener('storage', handleStorage) } } };
    }
  },
  
  // Simulated database methods for RLS queries
  from: (table) => {
    if (table !== 'projects') return { select: () => ({ data: [], error: { message: "Table not found" } }) };
    
    const getProjects = () => {
      const pStr = localStorage.getItem(MOCK_PROJECTS_KEY);
      return pStr ? JSON.parse(pStr) : [];
    };
    
    const saveProjects = (projects) => {
      localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));
    };

    return {
      select: () => {
        return {
          order: (col, { ascending } = {}) => {
            const list = getProjects();
            list.sort((a, b) => {
              const valA = a[col] || '';
              const valB = b[col] || '';
              if (valA < valB) return ascending ? -1 : 1;
              if (valA > valB) return ascending ? 1 : -1;
              return 0;
            });
            return Promise.resolve({ data: list, error: null });
          }
        };
      },
      insert: (rows) => {
        const list = getProjects();
        const newRows = Array.isArray(rows) 
          ? rows.map(r => ({ ...r, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }))
          : [{ ...rows, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }];
        
        list.push(...newRows);
        saveProjects(list);
        return Promise.resolve({ data: newRows, error: null });
      },
      update: (updates) => {
        return {
          eq: (col, val) => {
            const list = getProjects();
            let updatedCount = 0;
            const newList = list.map(item => {
              if (String(item[col]) === String(val)) {
                updatedCount++;
                return { ...item, ...updates };
              }
              return item;
            });
            saveProjects(newList);
            return Promise.resolve({ data: updates, error: null });
          }
        };
      },
      delete: () => {
        return {
          eq: (col, val) => {
            const list = getProjects();
            const newList = list.filter(item => String(item[col]) !== String(val));
            saveProjects(newList);
            return Promise.resolve({ data: { success: true }, error: null });
          }
        };
      }
    };
  }
};

// Hook/helper to get the active database client (real or mock)
export const getClient = () => {
  return isSupabaseConfigured ? supabase : mockSupabase;
};
