import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistSession, loadSession, clearSession } from '../sessionStorage';
import { cacheClear } from '../../api/cache';

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  accountPlan?: string;
  phone?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  hasCompletedOnboarding: boolean;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
}

// Rehydrate tokens from localStorage at module load time.
// user/business data is hydrated later by <SessionRestorer>.
const persistedSession = loadSession();

const initialState: AuthState = {
  isAuthenticated: persistedSession !== null,
  needsOnboarding: false,
  hasCompletedOnboarding: false,
  user: null,
  token: persistedSession?.token ?? null,
  refreshToken: persistedSession?.refreshToken ?? null,
};

const loadInitialState = (): AuthState => {
  try {
    const serialized = localStorage.getItem('lumen-iq-auth');
    if (serialized) {
      return { ...initialState, ...JSON.parse(serialized) };
    }
  } catch (err) {
    console.error('Failed to load auth state', err);
  }
  return initialState;
};

const saveState = (state: AuthState) => {
  try {
    localStorage.setItem('lumen-iq-auth', JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save auth state', err);
  }
};

export const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitialState(),
  reducers: {
    login: (
      state,
      action: PayloadAction<{
        email: string;
        token: string;
        refreshToken?: string;
        user?: Partial<AuthUser>;
      }>,
    ) => {
      state.isAuthenticated = true;
      state.hasCompletedOnboarding = true;
      state.user = {
        id: action.payload.user?.id ?? '',
        email: action.payload.email,
        ...action.payload.user,
      };
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? null;
      saveState(state);
      persistSession(action.payload.token, action.payload.refreshToken ?? '');
    },
    signup: (
      state,
      action: PayloadAction<{
        email: string;
        token: string;
        refreshToken?: string;
        user?: Partial<AuthUser>;
      }>,
    ) => {
      state.isAuthenticated = true;
      state.needsOnboarding = true;
      state.hasCompletedOnboarding = false;
      state.user = {
        id: action.payload.user?.id ?? '',
        email: action.payload.email,
        ...action.payload.user,
      };
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? null;
      saveState(state);
      persistSession(action.payload.token, action.payload.refreshToken ?? '');
    },
    setTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>,
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      saveState(state);
      // Keep localStorage in sync so the new tokens survive a page refresh
      persistSession(action.payload.token, action.payload.refreshToken);
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      saveState(state);
    },
    completeOnboarding: (state) => {
      state.hasCompletedOnboarding = true;
      state.needsOnboarding = false;
      saveState(state);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.needsOnboarding = false;
      state.hasCompletedOnboarding = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      saveState(state);
      clearSession();
      cacheClear();
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        saveState(state);
      }
    },
  },
});

export const { login, signup, setTokens, setUser, completeOnboarding, logout, updateUser } =
  authSlice.actions;

export default authSlice.reducer;
