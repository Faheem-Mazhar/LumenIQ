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

export const authSlice = createSlice({
  name: 'auth',
  initialState,
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
      persistSession(action.payload.token, action.payload.refreshToken ?? '');
    },
    setTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>,
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      // Keep localStorage in sync so the new tokens survive a page refresh
      persistSession(action.payload.token, action.payload.refreshToken);
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },
    completeOnboarding: (state) => {
      state.hasCompletedOnboarding = true;
      state.needsOnboarding = false;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.needsOnboarding = false;
      state.hasCompletedOnboarding = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      clearSession();
      cacheClear();
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { login, signup, setTokens, setUser, completeOnboarding, logout, updateUser } =
  authSlice.actions;

export default authSlice.reducer;
