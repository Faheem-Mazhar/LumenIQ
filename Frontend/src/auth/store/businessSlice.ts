import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Business } from '../../mockData';
import { MOCK_BUSINESSES } from '../../mockData';
import { logout } from './authSlice';

function withConsistentActiveFlags(businesses: Business[]): Business[] {
  if (businesses.length === 0) return businesses;
  const firstActive = businesses.find((b) => b.isActive);
  const keepId = firstActive?.id ?? businesses[0].id;
  return businesses.map((b) => ({ ...b, isActive: b.id === keepId }));
}

const initialBusinesses = withConsistentActiveFlags(
  MOCK_BUSINESSES.map((b) => ({ ...b })),
);

interface BusinessState {
  businesses: Business[];
}

const initialState: BusinessState = {
  businesses: initialBusinesses,
};

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    switchBusiness: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.businesses = state.businesses.map((b) => ({
        ...b,
        isActive: b.id === id,
      }));
    },
    addBusiness: (state, action: PayloadAction<Business>) => {
      state.businesses.push({ ...action.payload, isActive: action.payload.isActive ?? false });
    },
    removeBusiness: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.businesses.length <= 1) return;
      const removed = state.businesses.find((b) => b.id === id);
      if (!removed) return;
      const next = state.businesses.filter((b) => b.id !== id);
      if (removed.isActive && next.length > 0) {
        state.businesses = next.map((b, i) => ({ ...b, isActive: i === 0 }));
      } else {
        state.businesses = next;
      }
    },
    updateBusinessFields: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Business> }>,
    ) => {
      const idx = state.businesses.findIndex((b) => b.id === action.payload.id);
      if (idx < 0) return;
      state.businesses[idx] = {
        ...state.businesses[idx],
        ...action.payload.updates,
      };
    },
    replaceBusinesses: (state, action: PayloadAction<Business[]>) => {
      state.businesses = withConsistentActiveFlags(action.payload.map((b) => ({ ...b })));
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => ({
      businesses: withConsistentActiveFlags(MOCK_BUSINESSES.map((b) => ({ ...b }))),
    }));
  },
});

export const {
  switchBusiness,
  addBusiness,
  removeBusiness,
  updateBusinessFields,
  replaceBusinesses,
} = businessSlice.actions;

export default businessSlice.reducer;
