import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.log(
    "Running in Local Storage Mode: User projects, learning courses, notes, and progress will persist in your browser."
  );
}

// Local storage table keys for persistence
const STORAGE_PREFIX = 'skillweave_db_';
const MOCK_USER_KEY = 'skillweave_mock_user';

const getTableData = (table) => {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${table}`);
  return raw ? JSON.parse(raw) : [];
};

const saveTableData = (table, data) => {
  localStorage.setItem(`${STORAGE_PREFIX}${table}`, JSON.stringify(data));
};

// Seed default course if empty so user has immediate access to rich workspace demo
const initializeSeedData = () => {
  const courses = getTableData('courses');
  if (!courses || courses.length === 0) {
    const seedCourse = {
      id: 'course-python-ai',
      title: 'Python for AI & Modern Engineering',
      description: 'Master practical Python for Machine Learning, Generative AI, and RAG architectures.',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
      totalVideos: 3,
      totalDuration: '28m',
      progress: 33,
      status: 'In Progress',
      lastWatchedVideoId: 't_k_k_t',
      lastWatchedTimestamp: 120,
      lastActivity: new Date().toISOString(),
      modules: [
        {
          module_title: 'Module 1: Memory & Execution Models',
          objective: 'Understand how Python handles variable references and heap allocations.',
          exercise: 'Trace memory IDs of immutable objects.',
          videos: [
            {
              id: 't_k_k_t',
              title: 'Python Memory Architecture & Variables Demystified',
              channelTitle: 'TechDemystified',
              duration: 412,
              durationFormatted: '06:52',
              thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
              completed: true
            }
          ]
        },
        {
          module_title: 'Module 2: Iterators & Coroutines',
          objective: 'Master generator functions and async execution loops.',
          exercise: 'Implement a stream pipeline using yield.',
          videos: [
            {
              id: 'loop_t',
              title: 'Mastering Python Generators & Async Coroutines',
              channelTitle: 'PyGuru',
              duration: 620,
              durationFormatted: '10:20',
              thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=400&q=80',
              completed: false
            }
          ]
        },
        {
          module_title: 'Module 3: Advanced Metaclasses',
          objective: 'Build reusable class factories and validation frameworks.',
          exercise: 'Create an automatic schema validator with dunder methods.',
          videos: [
            {
              id: 'fn_t',
              title: 'Python Metaprogramming & Advanced Class Internals',
              channelTitle: 'CodeBlocks',
              duration: 540,
              durationFormatted: '09:00',
              thumbnail: 'https://images.unsplash.com/photo-1484417894907-623942c8ea29?auto=format&fit=crop&w=400&q=80',
              completed: false
            }
          ]
        }
      ]
    };
    saveTableData('courses', [seedCourse]);
  }
};

initializeSeedData();

// Mock client wrapper to simulate Supabase tables
export const mockSupabase = {
  auth: {
    signUp: async ({ email, password, options }) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const user = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        email,
        user_metadata: { name: options?.data?.name || email.split('@')[0] }
      };
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
      return { data: { user, session: { access_token: 'mock-session-token' } }, error: null };
    },
    signInWithPassword: async ({ email, password }) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (password.length < 4) {
        return { data: { user: null, session: null }, error: { message: "Invalid password (must be at least 4 characters)" } };
      }
      const existing = localStorage.getItem(MOCK_USER_KEY);
      const user = existing ? JSON.parse(existing) : {
        id: 'user-demo-123',
        email,
        user_metadata: { name: email.split('@')[0] }
      };
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
      return { data: { user, session: { access_token: 'mock-session-token' } }, error: null };
    },
    signInWithOAuth: async ({ provider }) => {
      await new Promise(resolve => setTimeout(resolve, 400));
      const user = {
        id: 'user-google-demo',
        email: 'learner.google@example.com',
        user_metadata: { name: 'Google Learner', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Google%20Learner&backgroundColor=111827' }
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
      const handleStorage = () => {
        const userStr = localStorage.getItem(MOCK_USER_KEY);
        const user = userStr ? JSON.parse(userStr) : null;
        callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null);
      };
      window.addEventListener('storage', handleStorage);
      const userStr = localStorage.getItem(MOCK_USER_KEY);
      const user = userStr ? JSON.parse(userStr) : null;
      setTimeout(() => callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null), 50);
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('storage', handleStorage) } } };
    }
  },

  from: (table) => {
    return {
      select: (columns = '*') => {
        return {
          order: (col, { ascending } = {}) => {
            const list = getTableData(table);
            list.sort((a, b) => {
              const valA = a[col] || '';
              const valB = b[col] || '';
              if (valA < valB) return ascending ? -1 : 1;
              if (valA > valB) return ascending ? 1 : -1;
              return 0;
            });
            return Promise.resolve({ data: list, error: null });
          },
          eq: (col, val) => {
            const list = getTableData(table);
            const filtered = list.filter(item => String(item[col]) === String(val));
            return Promise.resolve({ data: filtered, error: null });
          }
        };
      },
      insert: (rows) => {
        const list = getTableData(table);
        const newRows = Array.isArray(rows)
          ? rows.map(r => ({ ...r, id: r.id || 'id-' + Math.random().toString(36).substring(2, 9), created_at: new Date().toISOString() }))
          : [{ ...rows, id: rows.id || 'id-' + Math.random().toString(36).substring(2, 9), created_at: new Date().toISOString() }];
        
        list.push(...newRows);
        saveTableData(table, list);
        return Promise.resolve({ data: newRows, error: null });
      },
      update: (updates) => {
        return {
          eq: (col, val) => {
            const list = getTableData(table);
            const updated = list.map(item => {
              if (String(item[col]) === String(val)) {
                return { ...item, ...updates, updated_at: new Date().toISOString() };
              }
              return item;
            });
            saveTableData(table, updated);
            return Promise.resolve({ data: updates, error: null });
          }
        };
      },
      delete: () => {
        return {
          eq: (col, val) => {
            const list = getTableData(table);
            const remaining = list.filter(item => String(item[col]) !== String(val));
            saveTableData(table, remaining);
            return Promise.resolve({ data: { success: true }, error: null });
          }
        };
      }
    };
  }
};

export const getClient = () => {
  return isSupabaseConfigured ? supabase : mockSupabase;
};
