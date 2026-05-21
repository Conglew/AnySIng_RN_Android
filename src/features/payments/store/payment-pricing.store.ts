import { create } from 'zustand';

import { apiRequest } from '@/src/services/api/api-client';
import { ENDPOINTS } from '@/src/services/api/endpoints';

import { getAccessToken } from '@/src/services/auth/auth-token-store';

type StripeMatchedPrice = {
  priceId: string;
  productId: string;
  currency: string;
  unitAmount: number;
};

type StripePriceItem = {
  priceId: string;
  productId: string;
  currency: string;
  unitAmount: number;

  active?: boolean;
  nickname?: string | null;

  recurring?: {
    interval?: string;
  };

  type?: string;
};

type ProductPriceResponse = {
  ok: boolean;
  matchedPrice: StripeMatchedPrice | null;
  prices?: StripePriceItem[];
};

type PricingPlan = {
  productId: string;
  priceId: string;
  price: string;
  amount: number;
  currency: string;
};

type PaymentPricingStore = {
  monthly: PricingPlan | null;
  yearly: PricingPlan | null;

  isLoading: boolean;

  fetchPricing: () => Promise<void>;
};

function formatPrice(amount: number, currency: string) {
  const majorAmount = amount / 100;

  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: currency.toUpperCase(),

    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(majorAmount);
}

export const usePaymentPricingStore = create<PaymentPricingStore>((set) => ({
  monthly: null,
  yearly: null,

  isLoading: false,

  fetchPricing: async () => {
    try {
      set({ isLoading: true });

      const token = await getAccessToken();

      /**
       * 月方案
       */
      const monthlyResponse = await apiRequest<ProductPriceResponse, undefined>({
        method: 'GET',
        path: `${ENDPOINTS.payments.getStripePrice('prod_SVLp1uKu8unehM')}?interval=month`,
        token,
        timeoutMs: 15000,
      });

      /**
       * 年方案
       */
      const yearlyResponse = await apiRequest<ProductPriceResponse, undefined>({
        method: 'GET',
        path: `${ENDPOINTS.payments.getStripePrice('prod_Te0EbSJ9KCkFxQ')}?interval=year`,
        token,
        timeoutMs: 15000,
      });

      console.log('[PaymentPricing] monthly:', monthlyResponse);

      console.log('[PaymentPricing] yearly:', yearlyResponse);

      const monthlyPrice = monthlyResponse?.matchedPrice ?? monthlyResponse?.prices?.[0];

      const yearlyPrice = yearlyResponse?.matchedPrice ?? yearlyResponse?.prices?.[0];

      set({
        monthly: monthlyPrice
          ? {
              productId: monthlyPrice.productId ?? 'prod_SVLp1uKu8unehM',
              priceId: monthlyPrice.priceId,
              amount: monthlyPrice.unitAmount,
              currency: monthlyPrice.currency,
              price: formatPrice(monthlyPrice.unitAmount, monthlyPrice.currency),
            }
          : null,

        yearly: yearlyPrice
          ? {
              productId: yearlyPrice.productId ?? 'prod_Te0EbSJ9KCkFxQ',
              priceId: yearlyPrice.priceId,
              amount: yearlyPrice.unitAmount,
              currency: yearlyPrice.currency,
              price: formatPrice(yearlyPrice.unitAmount, yearlyPrice.currency),
            }
          : null,

        isLoading: false,
      });
    } catch (error) {
      console.log('[PaymentPricing] fetch failed:', error);

      set({
        isLoading: false,
      });
    }
  },
}));
