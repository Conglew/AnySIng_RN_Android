import { create } from 'zustand';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { authClient } from '@/src/services/auth/auth-client';
import type { BillingSummaryResponse } from '@/src/services/auth/auth.types';

export type SettingsBillingViewModel = {
  userEmail: string;
  orderNumber: string;
  orderDate: string;
  subscriptionPeriod: string;
  planName: string;
  planAmount: string;
  paymentAccount: string;
  billingAddress: string;
};

type BillingSummaryStore = {
  rawBilling: BillingSummaryResponse | null;
  settingsBilling: SettingsBillingViewModel | null;
  isLoading: boolean;
  errorMessage: string;

  fetchBillingSummaryOnce: () => Promise<void>;
  refreshBillingSummary: () => Promise<void>;
  clearBillingSummary: () => void;
};

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

function formatDateRange(startValue?: string | null, endValue?: string | null) {
  const startText = formatDate(startValue);
  const endText = formatDate(endValue);

  if (startText === '-' && endText === '-') {
    return '-';
  }

  return `${startText} - ${endText}`;
}

function formatAmount(amount?: number | null, currency?: string | null) {
  if (amount == null || !currency) {
    return '-';
  }

  /**
   * Stripe 金額通常是最小貨幣單位。
   * 例如 MYR 15000 = MYR 150.00
   */
  const normalizedAmount = amount / 100;

  return `${currency.toUpperCase()} ${normalizedAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPaymentAccount(
  paymentMethod?: BillingSummaryResponse['subscription'] extends infer Subscription
    ? Subscription extends { defaultPaymentMethod: infer PaymentMethod }
      ? PaymentMethod
      : never
    : never,
) {
  if (!paymentMethod || typeof paymentMethod !== 'object') {
    return '-';
  }

  const record = paymentMethod as {
    brand?: string | null;
    last4?: string | null;
  };

  const brand = record.brand ? record.brand.toUpperCase() : 'CARD';
  const last4 = record.last4 ? `**** ${record.last4}` : '****';

  return `${brand} ${last4}`;
}

function formatBillingAddress(address?: Record<string, unknown> | null) {
  if (!address) {
    return '-';
  }

  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return parts.length > 0 ? parts.join(' ') : '-';
}

function mapBillingSummaryToSettingsView(
  billing: BillingSummaryResponse,
): SettingsBillingViewModel {
  const subscription = billing.subscription;
  const paymentMethod = subscription?.defaultPaymentMethod ?? null;

  return {
    userEmail: billing.userEmail || '-',

    orderNumber:
      subscription?.latestInvoice?.number || subscription?.orderNumber || subscription?.id || '-',

    orderDate: formatDate(subscription?.subscribedAt),

    /**
     * 訂閱有效期間：
     * 優先使用 currentPeriodStart/currentPeriodEnd。
     * 如果 currentPeriodStart 還沒從後端拿到，開始日期先 fallback 使用 subscribedAt。
     */
    subscriptionPeriod: formatDateRange(
      subscription?.currentPeriodStart ?? subscription?.subscribedAt,
      subscription?.currentPeriodEnd,
    ),

    planName: subscription?.planName || '-',

    planAmount: formatAmount(subscription?.amount, subscription?.currency),

    paymentAccount: formatPaymentAccount(paymentMethod),

    billingAddress: formatBillingAddress(paymentMethod?.billingAddress ?? null),
  };
}

export const useBillingSummaryStore = create<BillingSummaryStore>((set, get) => ({
  rawBilling: null,
  settingsBilling: null,
  isLoading: false,
  errorMessage: '',

  fetchBillingSummaryOnce: async () => {
    const currentBilling = get().settingsBilling;

    /**
     * 已經有 cache，就不重複 call API。
     */
    if (currentBilling) {
      console.log('[BillingSummaryStore] use cached billing summary:', currentBilling);
      return;
    }

    await get().refreshBillingSummary();
  },

  refreshBillingSummary: async () => {
    try {
      set({
        isLoading: true,
        errorMessage: '',
      });

      const token = await getAccessToken();

      if (!token) {
        set({
          isLoading: false,
          errorMessage: 'Missing access token.',
        });
        return;
      }

      const billing = await authClient.billingSummary(token);
      const settingsBilling = mapBillingSummaryToSettingsView(billing);

      console.log(
        '[BillingSummaryStore] billing summary view model:',
        JSON.stringify(settingsBilling, null, 2),
      );

      set({
        rawBilling: billing,
        settingsBilling,
        isLoading: false,
        errorMessage: '',
      });
    } catch (error) {
      console.log('[BillingSummaryStore] fetch billing summary failed:', error);

      set({
        isLoading: false,
        errorMessage: error instanceof Error ? error.message : 'Failed to fetch billing summary.',
      });
    }
  },

  clearBillingSummary: () => {
    set({
      rawBilling: null,
      settingsBilling: null,
      isLoading: false,
      errorMessage: '',
    });
  },
}));
