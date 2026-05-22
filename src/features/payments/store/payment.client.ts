import { apiRequest } from '@/src/services/api/api-client';
import { ENDPOINTS } from '@/src/services/api/endpoints';

import { ValidatePromotionCodeResponse } from '../types/payment-plan.type';

type CreateSubscriptionSessionRequest = {
  priceId: string;
  promotionCodeId?: string | null;
};

type CreateSubscriptionSessionResponse = {
  url: string;
};

type SubscriptionStatusResponse = {
  active: boolean;
  status: string;
  planId: string | null;
  currentPeriodEnd: string | null;
};

export const paymentClient = {
  async validatePromotionCode({
    token,
    code,
    productId,
  }: {
    token: string;
    code: string;
    productId: string;
  }) {
    return apiRequest<ValidatePromotionCodeResponse, undefined>({
      method: 'GET',
      path:
        `${ENDPOINTS.payments.validatePromotionCode}` +
        `?code=${encodeURIComponent(code)}` +
        `&productId=${encodeURIComponent(productId)}`,
      token,
      timeoutMs: 15000,
    });
  },

  async createSubscriptionSession({
    token,
    priceId,
    promotionCodeId,
  }: {
    token: string;
    priceId: string;
    promotionCodeId?: string | null;
  }) {
    return apiRequest<CreateSubscriptionSessionResponse, CreateSubscriptionSessionRequest>({
      method: 'POST',
      path: ENDPOINTS.payments.createSubscriptionSession,
      token,
      body: {
        priceId,
        promotionCodeId,
      },
      timeoutMs: 15000,
    });
  },

  async getSubscriptionStatus({ token }: { token: string }) {
    return apiRequest<SubscriptionStatusResponse, undefined>({
      method: 'GET',
      path: ENDPOINTS.payments.subscriptionStatus,
      token,
      timeoutMs: 15000,
    });
  },
};
