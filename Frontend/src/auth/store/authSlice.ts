import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  hasCompletedOnboarding: boolean;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    /** Profile photo URL when provided by API */
    avatarUrl?: string;
    /** Display label e.g. "Pro", "Starter" */
    accountPlan?: string;
  } | null;
  token: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  needsOnboarding: false,
  hasCompletedOnboarding: false,
  user: null,
  token: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ email: string; token: string }>) => {
      state.isAuthenticated = true;
      state.hasCompletedOnboarding = true; // Existing users skip onboarding
      state.user = {
        id: 'mock-user-id',
        email: action.payload.email,
      };
      state.token = action.payload.token;
    },
    signup: (state, action: PayloadAction<{ email: string; token: string }>) => {
      state.isAuthenticated = true;
      state.needsOnboarding = true; // New users need onboarding
      state.hasCompletedOnboarding = false;
      state.user = {
        id: 'mock-user-id',
        email: action.payload.email,
      };
      state.token = action.payload.token;
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
    },
    updateUser: (state, action: PayloadAction<Partial<AuthState['user']>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { login, signup, completeOnboarding, logout, updateUser } = authSlice.actions;

export default authSlice.reducer;
