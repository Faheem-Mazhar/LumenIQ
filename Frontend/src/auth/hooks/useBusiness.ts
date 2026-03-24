import { useDispatch, useSelector } from 'react-redux';
import type { Business } from '../../mockData';
import type { RootState, AppDispatch } from '../store';
import {
  switchBusiness,
  addBusiness,
  removeBusiness,
  updateBusinessFields,
} from '../store/businessSlice';

export function selectBusinesses(state: RootState) {
  return state.business.businesses;
}

export function selectActiveBusiness(state: RootState): Business | undefined {
  const { businesses } = state.business;
  if (businesses.length === 0) return undefined;
  return businesses.find((b) => b.isActive) ?? businesses[0];
}

export function useBusiness() {
  const dispatch = useDispatch<AppDispatch>();
  const businesses = useSelector(selectBusinesses);
  const activeBusiness = useSelector(selectActiveBusiness);

  return {
    businesses,
    activeBusiness,
    switchBusiness: (businessId: string) => dispatch(switchBusiness(businessId)),
    addBusiness: (business: Business) => dispatch(addBusiness(business)),
    removeBusiness: (businessId: string) => dispatch(removeBusiness(businessId)),
    updateBusinessFields: (id: string, updates: Partial<Business>) =>
      dispatch(updateBusinessFields({ id, updates })),
  };
}
