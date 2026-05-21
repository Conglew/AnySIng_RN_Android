import { create } from 'zustand';

type PaymentCouponStore = {
  couponCode: string;

  promotionCodeId: string | null;

  percentOff: number | null;
  amountOff: number | null;

  isValid: boolean;

  isLoading: boolean;

  errorMessage: string | null;

  setCouponCode: (code: string) => void;

  setCouponResult: (params: {
    promotionCodeId: string;

    percentOff: number | null;
    amountOff: number | null;
  }) => void;

  clearCoupon: () => void;

  setLoading: (loading: boolean) => void;

  setErrorMessage: (message: string | null) => void;
};

export const usePaymentCouponStore = create<PaymentCouponStore>((set) => ({
  couponCode: '',

  promotionCodeId: null,

  percentOff: null,
  amountOff: null,

  isValid: false,

  isLoading: false,

  errorMessage: null,

  setCouponCode: (couponCode) => {
    set({
      couponCode,
    });
  },

  setCouponResult: ({ promotionCodeId, percentOff, amountOff }) => {
    set({
      promotionCodeId,

      percentOff,
      amountOff,

      isValid: true,

      errorMessage: null,
    });
  },

  clearCoupon: () => {
    set({
      promotionCodeId: null,

      percentOff: null,
      amountOff: null,

      isValid: false,

      errorMessage: null,
    });
  },

  setLoading: (isLoading) => {
    set({
      isLoading,
    });
  },

  setErrorMessage: (errorMessage) => {
    set({
      errorMessage,
    });
  },
}));
