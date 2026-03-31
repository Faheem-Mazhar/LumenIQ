import { api } from './client';
import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CustomerPortalResponse,
  VerifyCheckoutSessionRequest,
  VerifyCheckoutSessionResponse,
} from '../types/payment';

export const paymentsApi = {
  createCheckout: (data: CreateCheckoutSessionRequest) =>
    api.post<CreateCheckoutSessionResponse>('/payments/checkout', data),

  createPortal: (returnUrl: string) =>
    api.post<CustomerPortalResponse>('/payments/customer-portal', { return_url: returnUrl }),

  getHistory: () =>
    api.get('/payments/history'),

  verifyCheckout: (data: VerifyCheckoutSessionRequest) =>
    api.post<VerifyCheckoutSessionResponse>('/payments/verify', data),
};
