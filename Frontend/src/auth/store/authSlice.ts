import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

const initialState: AuthState = {
  isAuthenticated: false,
  needsOnboarding: false,
  hasCompletedOnboarding: false,
  user: null,
  token: null,
  refreshToken: null,
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
    },
    setTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>,
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      saveState(state);
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
